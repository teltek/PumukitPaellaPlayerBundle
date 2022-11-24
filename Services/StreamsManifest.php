<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Doctrine\ODM\MongoDB\DocumentManager;
use Pumukit\BaseLivePlayerBundle\Services\LiveService;
use Pumukit\BasePlayerBundle\Services\TrackUrlService;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Services\PicService;

class StreamsManifest
{
    private $documentManager;
    private $picService;
    private $trackUrlService;
    private $liveService;
    private $requestContextScheme;
    private $requestContextHost;

    public function __construct(
        DocumentManager $documentManager,
        PicService $picService,
        TrackUrlService $trackUrlService,
        LiveService $liveService,
        string $requestContextScheme,
        string $requestContextHost
    ) {
        $this->documentManager = $documentManager;
        $this->picService = $picService;
        $this->trackUrlService = $trackUrlService;
        $this->liveService = $liveService;
        $this->requestContextScheme = $requestContextScheme;
        $this->requestContextHost = $requestContextHost;
    }

    public function createStreamsForVoD(MultimediaObject $multimediaObject, ?string $trackId): array
    {
        $data = [];
        $data['streams'] = [];

        if (!$multimediaObject->isMultistream()) {
            $track = $multimediaObject->getTrackById($trackId) ?? $multimediaObject->getDisplayTrack();
            if ($track) {
                $dataStream = $this->buildDataStream([$track]);
                $dataStream['content'] = 'presenter';
                $dataStream['audioTag'] = $track->getLanguage();

                $pic = $this->getPreview($multimediaObject);

                $dataStream['preview'] = $pic;
                $dataStream['language'] = $track->getLanguage();
                $data['streams'][] = $dataStream;
            }

            return $data;
        }

        $tracks = $this->getMmobjTracks($multimediaObject, $trackId);

        // Camera tracks
        if ($tracks['display']) {
            $dataStream = $this->buildDataStream($tracks['display']);
            $pic = $this->getPreview($multimediaObject);
            $dataStream['preview'] = $pic;
            $dataStream['language'] = $tracks['display'][0]->getLanguage();
            $dataStream['content'] = 'presenter';
            $dataStream['audioTag'] = $tracks['display'][0]->getLanguage();
            $data['streams'][] = $dataStream;
        }

        // Presentation tracks
        if ($tracks['presentation']) {
            $dataStream = $this->buildDataStream($tracks['presentation']);
            $dataStream['language'] = $tracks['presentation'][0]->getLanguage();
            $dataStream['content'] = 'presentation';
            $data['streams'][] = $dataStream;
        }

        return $data;
    }

    public function createStreamsForLive(MultimediaObject $multimediaObject): array
    {
        $data = [];
        $live = $multimediaObject->getEmbeddedEvent()->getLive();

        $url = $this->liveService->generateHlsUrl($live);
        if (false === strpos($url, 'https')) {
            $url = 'https:'.$url;
        }

        $dataStream = $this->buildDataLive([$url], 'video/mp4');
        $dataStream['preview'] = '';
        $dataStream['content'] = 'presenter';
        $dataStream['role'] = 'mainAudio';
        $data['streams'][] = $dataStream;

        return $data;
    }

    public function buildDataLive(array $urls, string $mimeType): array
    {
        $dataStream = [];
        $sources = [];
        foreach ($urls as $url) {
            $src = $url;
            $dataStreamTrack = [
                'src' => $src,
                'mimetype' => $mimeType,
            ];

//            if ($track->getWidth() && $track->getHeight()) {
//                $dataStreamTrack['res'] = ['w' => $track->getWidth(), 'h' => $track->getHeight()];
//            }

            if (!isset($sources['hlsLive'])) {
                $sources['hlsLive'] = [];
            }
            $sources['hlsLive'][] = $dataStreamTrack;
        }
        $dataStream['sources'] = $sources;

        return $dataStream;
    }

    private function getMmobjTracks(MultimediaObject $multimediaObject, ?string $trackId): array
    {
        $tracks = [
            'display' => [],
            'presentation' => [],
            'sbs' => [],
        ];
        $availableCodecs = ['h264', 'vp8', 'vp9'];

        if ($trackId) {
            $track = $multimediaObject->getTrackById($trackId);
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

        $presenterTracks = $multimediaObject->getFilteredTracksWithTags(['presenter/delivery']);
        $presentationTracks = $multimediaObject->getFilteredTracksWithTags(['presentation/delivery']);
        $sbsTrack = $multimediaObject->getTrackWithTag('sbs');

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
            $track = $multimediaObject->getDisplayTrack();
            if ($track && in_array($track->getVcodec(), $availableCodecs)) {
                $tracks['display'][] = $track;
            }
        }

        return $tracks;
    }

    private function buildDataStream(array $tracks)
    {
        $dataStream = [];
        $sources = [];
        foreach ($tracks as $track) {
            $mimeType = $track->getMimetype();
            $src = $this->getAbsoluteUrl($this->trackUrlService->generateTrackFileUrl($track));

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

    private function getAbsoluteUrl(string $url): string
    {
        if (false !== strpos($url, '://') || 0 === strpos($url, '//')) {
            return $url;
        }

        return $this->requestContextScheme.'://'.$this->requestContextHost.$url;
    }

    private function getPreview(MultimediaObject $multimediaObject)
    {
        $image = $this->picService->getPosterUrl($multimediaObject, true);
        if (!$image) {
            $image = $this->picService->getFirstUrlPic($multimediaObject, true, true);
        }

        return $image;
    }
}
