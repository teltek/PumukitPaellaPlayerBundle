<?php

namespace Pumukit\PaellaPlayerBundle\Services;

use Doctrine\ODM\MongoDB\DocumentManager;
use Pumukit\BasePlayerBundle\Services\SeriesPlaylistService;
use Pumukit\BasePlayerBundle\Services\TrackUrlService;
use Pumukit\BasePlayerBundle\Services\UserAgentParserService;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Pumukit\SchemaBundle\Services\MaterialService;
use Pumukit\SchemaBundle\Services\PicService;
use SunCat\MobileDetectBundle\DeviceDetector\MobileDetector;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * Class PaellaDataService.
 */
class PaellaDataService
{
    private $picService;
    private $trackService;
    private $opencastClient;
    private $mobileDetectorService;
    private $userAgentParserService;
    private $dm;
    private $playlistService;
    private $materialService;
    private $urlGenerator;
    private $forceDual;

    /**
     * PaellaDataService constructor.
     *
     * @param $forceDual
     */
    public function __construct(DocumentManager $dm, PicService $picService, TrackUrlService $trackService, SeriesPlaylistService $playlistService, MaterialService $materialService, UrlGeneratorInterface $urlGenerator, MobileDetector $mobileDetectorService, UserAgentParserService $userAgentParserService, $forceDual)
    {
        $this->picService = $picService;
        $this->trackService = $trackService;
        $this->playlistService = $playlistService;
        $this->materialService = $materialService;
        $this->urlGenerator = $urlGenerator;
        //Only used to check whether the request is mobile and return a side-by-side on opencast videos.
        $this->mobileDetectorService = $mobileDetectorService;
        $this->userAgentParserService = $userAgentParserService;
        $this->forceDual = $forceDual;
        $this->dm = $dm;
    }

    /**
     * @param $opencastClient
     */
    public function setOpencastClient($opencastClient)
    {
        $this->opencastClient = $opencastClient;
    }

    /**
     * Returns a dictionary array with the playlist data using the paella playlist plugin necessary structure.
     *
     * This structure can be later serialized and returned as a json file for the paella player to use.
     *
     * @param array $criteria
     *
     * @return array
     */
    public function getPaellaPlaylistData(Series $series, $criteria = [])
    {
        if (!$series->isPlaylist()) {
            $criteria['series'] = new \MongoId($series->getId());
            $criteria['type'] = ['$ne' => MultimediaObject::TYPE_LIVE];
            $criteria['status'] = ['$ne' => MultimediaObject::STATUS_PROTOTYPE];
            $mmobjs = $this->dm->getRepository('PumukitSchemaBundle:MultimediaObject')->findBy($criteria, ['rank' => 'asc']);
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

    /**
     * Returns a dictionary array with the mmobj data using the paella prefered structure.
     *
     * This structure can be later serialized and returned as a json file for the paella player to use.
     *
     * @return array
     */
    public function getPaellaMmobjData(MultimediaObject $mmobj, Request $request)
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
            'preview' => $this->getPicForObject($mmobj, true, true),
            'description' => $mmobj->getDescription(),
            'duration' => $mmobj->getDuration(),
            'i18nTitle' => $mmobj->getI18nTitle(),
            'i18nDescription' => $mmobj->getI18nDescription(),
        ];

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

    /**
     * Returns the absolute url from a given path or url.
     *
     * @param $url
     *
     * @return string
     */
    private function getAbsoluteUrl(Request $request, $url)
    {
        if (false !== strpos($url, '://') || 0 === strpos($url, '//')) {
            return $url;
        }

        if ('' === $request->getHost()) {
            return $url;
        }

        return $request->getSchemeAndHttpHost().$request->getBasePath().$url;
    }

    /**
     * Returns an array (can be empty) of tracks for the mmobj.
     *
     * @param $trackId
     *
     * @return array
     */
    private function getMmobjTracks(MultimediaObject $mmobj, $trackId)
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

    /**
     * Returns a frameList formatted to be added to the paella.
     *
     * @return array|null
     */
    private function getOpencastFrameList(MultimediaObject $mmobj)
    {
        $images = $this->getFrameListFromPumukit($mmobj);

        if (!$images) {
            $images = $this->getFrameListFromOpencast($mmobj);
        }

        return $images;
    }

    /**
     * @return array|null
     */
    private function getFrameListFromPumukit(MultimediaObject $multimediaObject)
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

    /**
     * @return array
     */
    private function getFrameListFromOpencast(MultimediaObject $multimediaObject)
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

    /**
     * Returns a caption list formatted to be added to the paella.
     *
     * @return array
     */
    private function getCaptions(MultimediaObject $mmobj, Request $request)
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

    /**
     * Returns a data array with the required paella structure for a 'data stream'.
     *
     * @return mixed
     */
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

    /**
     * Returns whether the request comes from a 'mobile device'.
     *
     * @return bool
     */
    private function isMobile(Request $request)
    {
        $userAgent = $request->headers->get('user-agent');

        return $this->mobileDetectorService->isMobile($userAgent) || $this->mobileDetectorService->isTablet($userAgent);
    }

    /**
     * @param $mmobj
     * @param $absolute
     * @param $hd
     *
     * @return string|null
     */
    private function getPicForObject($mmobj, $absolute, $hd)
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
