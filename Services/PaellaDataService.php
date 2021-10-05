<?php

namespace Pumukit\PaellaPlayerBundle\Services;

use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use Pumukit\BasePlayerBundle\Services\SeriesPlaylistService;
use Pumukit\BasePlayerBundle\Services\TrackUrlService;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Pumukit\SchemaBundle\Services\MaterialService;
use Pumukit\SchemaBundle\Services\PicService;
use SunCat\MobileDetectBundle\DeviceDetector\MobileDetector;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class PaellaDataService
{
    private $picService;
    private $trackService;
    private $opencastClient;
    private $mobileDetectorService;
    private $dm;
    private $playlistService;
    private $materialService;
    private $urlGenerator;
    private $forceDual;

    public function __construct(
        DocumentManager $documentManager,
        PicService $picService,
        TrackUrlService $trackService,
        SeriesPlaylistService $playlistService,
        MaterialService $materialService,
        UrlGeneratorInterface $urlGenerator,
        MobileDetector $mobileDetectorService,
        bool $forceDual,
        string $requestContextScheme,
        string $requestContextHost
    ) {
        $this->picService = $picService;
        $this->trackService = $trackService;
        $this->playlistService = $playlistService;
        $this->materialService = $materialService;
        $this->urlGenerator = $urlGenerator;
        $this->mobileDetectorService = $mobileDetectorService;
        $this->forceDual = $forceDual;
        $this->dm = $documentManager;
        $this->requestContextScheme = $requestContextScheme;
        $this->requestContextHost = $requestContextHost;
    }

    public function setOpencastClient($opencastClient): void
    {
        $this->opencastClient = $opencastClient;
    }

    public function getPaellaPlaylistData(Series $series, array $criteria = []): array
    {
        if (!$series->isPlaylist()) {
            $criteria['series'] = new ObjectId($series->getId());
            $criteria['type'] = ['$ne' => MultimediaObject::TYPE_LIVE];
            $criteria['status'] = ['$ne' => MultimediaObject::STATUS_PROTOTYPE];
            $mmobjs = $this->dm->getRepository(MultimediaObject::class)->findBy($criteria, ['rank' => 'asc']);
        } else {
            $mmobjs = $this->playlistService->getPlaylistMmobjs($series, $criteria);
        }

        $data = [];
        foreach ($mmobjs as $pos => $mmobj) {
            $url = $this->urlGenerator->generate(
                'pumukit_playlistplayer_paellaindex',
                [
                    'playlistId' => $series->getId(),
                    'videoId' => $mmobj->getId(),
                    'videoPos' => $pos,
                    'autostart' => 'true',
                ],
                UrlGeneratorInterface::ABSOLUTE_URL  //Makes the url absolute.
            );
            $data[] = [
                'name' => $mmobj->getTitle(),
                'id' => $mmobj->getId(),
                'pos' => $pos,
                'url' => $url,
            ];
        }

        return $data;
    }

    public function getPaellaMmobjData(MultimediaObject $mmobj, Request $request): array
    {
        $trackId = $request->query->get('track_id');
        $isMobile = $this->isMobile($request);

        // Preview test of https://github.com/teltek/PuMuKIT2-paella-player-bundle/issues/32
        if ($this->forceDual || $request->query->get('force_dual')) {
            $isMobile = false;
        }

        $data = [];
        $data['streams'] = [];
        $tracks = $this->getMmobjTracks($mmobj, $trackId);

        if ($mmobj->isOnlyAudio()) {
            if ($trackId) {
                $track = $mmobj->getTrackById($trackId);
            } else {
                $track = $mmobj->getDisplayTrack();
            }

            if ($track) {
                $dataStream = $this->buildDataStream([$track], $request);

                $pic = $this->getPicForObject($mmobj, true, true);

                $dataStream['preview'] = $pic;
                $dataStream['language'] = $track->getLanguage();
                $data['streams'][] = $dataStream;
            }
        } elseif ($isMobile) {
            if ($tracks['sbs']) {
                $dataStream = $this->buildDataStream($tracks['sbs'], $request);
                $dataStream['language'] = $tracks['sbs'][0]->getLanguage();
            } elseif ($tracks['display']) {
                $dataStream = $this->buildDataStream($tracks['display'], $request);
                $dataStream['language'] = $tracks['display'][0]->getLanguage();
            }

            $pic = $this->getPicForObject($mmobj, true, true);

            $dataStream['preview'] = $pic;
            $data['streams'][] = $dataStream;
        } else {
            if ($tracks['display']) {
                $dataStream = $this->buildDataStream($tracks['display'], $request);
                $pic = $this->getPicForObject($mmobj, true, true);
                $dataStream['preview'] = $pic;
                $dataStream['content'] = 'presenter';
                $dataStream['language'] = $tracks['display'][0]->getLanguage();
                $data['streams'][] = $dataStream;
            }
            if ($tracks['presentation']) {
                $dataStream = $this->buildDataStream($tracks['presentation'], $request);
                $dataStream['content'] = 'presentation';
                $dataStream['language'] = $tracks['presentation'][0]->getLanguage();
                $data['streams'][] = $dataStream;
            }
        }
        $data['metadata'] = [
            'title' => $mmobj->getTitle(),
            'description' => $mmobj->getDescription(),
            'duration' => $mmobj->getDuration(),
            'i18nTitle' => $mmobj->getI18nTitle(),
            'i18nDescription' => $mmobj->getI18nDescription(),
        ];

        if (!$request->query->get('autostart')) {
            $data['metadata'] = [
                'preview' => $this->getPicForObject($mmobj, true, true),
            ];
        }

        $frameList = $this->getOpencastFrameList($mmobj);
        if ($frameList) {
            $data['frameList'] = $frameList;
        }

        $captions = $this->getCaptions($mmobj, $request);
        if ($captions) {
            $data['captions'] = $captions;
        }

        return $data;
    }

    private function getAbsoluteUrl(Request $request, string $url): string
    {
        if (false !== strpos($url, '://') || 0 === strpos($url, '//')) {
            return $url;
        }

        if ('' === $request->getHost()) {
            return $url;
        }

        return $this->requestContextScheme.'://'.$this->requestContextHost.$request->getBasePath().$url;
    }

    private function getMmobjTracks(MultimediaObject $mmobj, ?string $trackId): array
    {
        $tracks = [
            'display' => [],
            'presentation' => [],
            'sbs' => [],
        ];
        $availableCodecs = ['h264', 'vp8', 'vp9'];

        if ($trackId) {
            $track = $mmobj->getTrackById($trackId);
            if ($track) {
                if ($track->containsAnyTag(['display', 'presenter/delivery', 'presentation/delivery']) && in_array($track->getVcodec(), $availableCodecs)) {
                    $tracks['display'][] = $track;
                }
                if ($track->isOnlyAudio()) {
                    $tracks['display'][] = $track;
                }

                return $tracks;
            }
        }

        $presenterTracks = $mmobj->getFilteredTracksWithTags(['presenter/delivery']);
        $presentationTracks = $mmobj->getFilteredTracksWithTags(['presentation/delivery']);
        $sbsTrack = $mmobj->getTrackWithTag('sbs');

        foreach ($presenterTracks as $track) {
            if (in_array($track->getVcodec(), $availableCodecs)) {
                $tracks['display'][] = $track;
            }
        }
        foreach ($presentationTracks as $track) {
            if (in_array($track->getVcodec(), $availableCodecs)) {
                $tracks['presentation'][] = $track;
            }
        }

        if ($sbsTrack && in_array($sbsTrack->getVcodec(), $availableCodecs)) {
            $tracks['sbs'][] = $sbsTrack;
        }

        if (!$tracks['display'] && !$tracks['presentation']) {
            $track = $mmobj->getDisplayTrack();
            if ($track && in_array($track->getVcodec(), $availableCodecs)) {
                $tracks['display'][] = $track;
            }
        }

        return $tracks;
    }

    private function getOpencastFrameList(MultimediaObject $mmobj): array
    {
        $images = $this->getFrameListFromPumukit($mmobj);

        if (!$images) {
            $images = $this->getFrameListFromOpencast($mmobj);
        }

        return $images;
    }

    private function getFrameListFromPumukit(MultimediaObject $multimediaObject): ?array
    {
        if (!method_exists($multimediaObject, 'getEmbeddedSegments')) {
            return null;
        }

        $segments = $multimediaObject->getEmbeddedSegments();
        if (!$segments) {
            return null;
        }

        $images = [];
        foreach ($segments as $segment) {
            $time = (int) ($segment->getTime() / 1000);
            $id = 'frame_'.$time;
            $mimeType = 'image/jpeg';

            $images[] = [
                'id' => $id,
                'mimetype' => $mimeType,
                'time' => $time,
                'url' => $segment->getPreview(),
                'thumb' => $segment->getPreview(),
                'caption' => $segment->getText(),
            ];
        }

        return $images;
    }

    private function getFrameListFromOpencast(MultimediaObject $multimediaObject): array
    {
        if (!$this->opencastClient) {
            return [];
        }

        $images = [];
        if ($opencastId = $multimediaObject->getProperty('opencast')) {
            $mediaPackage = null;

            try {
                $mediaPackage = $this->opencastClient->getFullMediaPackage($opencastId);
            } catch (\Exception $e) {
                //TODO: Inject logger and log a warning.
            }

            if (!isset($mediaPackage['segments']['segment'])) {
                return [];
            }

            //Fix Opencast one-result behavior
            if (isset($mediaPackage['segments']['segment']['time'])) {
                $segments = [$mediaPackage['segments']['segment']];
            } else {
                $segments = $mediaPackage['segments']['segment'];
            }

            foreach ($segments as $segment) {
                $time = (int) ($segment['time'] / 1000);
                $id = 'frame_'.$time;
                $mimeType = 'image/jpeg';

                $url = '';
                if (isset($segment['previews']['preview']['$'])) {
                    $url = $segment['previews']['preview']['$'];
                }

                $images[] = [
                    'id' => $id,
                    'mimetype' => $mimeType,
                    'time' => $time,
                    'url' => $url,
                    'thumb' => $url,
                    'caption' => $segment['text'],
                ];
            }
        }

        return $images;
    }

    private function getCaptions(MultimediaObject $mmobj, Request $request): array
    {
        $captions = $this->materialService->getCaptions($mmobj);

        $captionsMapped = array_map(
            function ($material) use ($request) {
                return [
                    'lang' => $material->getLanguage(),
                    'text' => $material->getName() ? $material->getName() : $material->getLanguage(),
                    'format' => $material->getMimeType(),
                    'url' => $this->getAbsoluteUrl($request, $material->getUrl()),
                ];
            },
            $captions->toArray()
        );

        return array_values($captionsMapped);
    }

    private function buildDataStream(array $tracks, Request $request)
    {
        $sources = [];
        foreach ($tracks as $track) {
            $mimeType = $track->getMimetype();
            $src = $this->getAbsoluteUrl($request, $this->trackService->generateTrackFileUrl($track));

            $dataStreamTrack = [
                'src' => $src,
                'mimetype' => $mimeType,
            ];

            // If pumukit doesn't know the resolution, paella can guess it.
            if ($track->getWidth() && $track->getHeight()) {
                $dataStreamTrack['res'] = ['w' => $track->getWidth(), 'h' => $track->getHeight()];
            }

            $format = explode('/', $mimeType)[1] ?? 'mp4';

            // Hotfix use mp4 when mp3. See https://github.com/polimediaupv/paella/pull/347
            if (in_array($format, ['mpeg', 'x-m4a']) && $track->isOnlyAudio()) {
                $format = 'mp4';
            }

            if (!isset($sources[$format])) {
                $sources[$format] = [];
            }
            $sources[$format][] = $dataStreamTrack;
        }
        $dataStream['sources'] = $sources;

        return $dataStream;
    }

    private function isMobile(Request $request): bool
    {
        $userAgent = $request->headers->get('user-agent');

        return $this->mobileDetectorService->isMobile($userAgent) || $this->mobileDetectorService->isTablet($userAgent);
    }

    private function getPicForObject(MultimediaObject $mmobj, bool $absolute, bool $hd): string
    {
        $pic = null;

        if (method_exists($this->picService, 'getPosterUrl')) {
            $pic = $this->picService->getPosterUrl($mmobj, $absolute);
        }

        if (!$pic) {
            $pic = $this->picService->getFirstUrlPic($mmobj, $absolute, $hd);
        }

        return $pic;
    }
}
