<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Pumukit\BaseLivePlayerBundle\Services\LiveService;
use Pumukit\SchemaBundle\Document\Live;

class ChannelManifest
{
    protected $liveService;
    protected $streamsManifest;

    public function __construct(
        LiveService $liveService,
        StreamsManifest $streamsManifest
    ) {
        $this->liveService = $liveService;
        $this->streamsManifest = $streamsManifest;
    }

    public function create(Live $live): array
    {
        $data['metadata'] = $this->addMandatoryManifestMetadata($live);
        $data['metadata'] = $this->addCustomManifestMetadata($live, $data['metadata']);

        $data['streams'] = $this->createStreamsForChannel($live);

        return $data;
    }

    private function addMandatoryManifestMetadata(Live $live)
    {
        $data['id'] = $live->getId();
        $data['title'] = $live->getName();
        $data['preview'] = '';
        $data['duration'] = 0;

        return $data;
    }

    private function addCustomManifestMetadata(Live $live, array $data): array
    {
        $data['i18nTitle'] = $live->getI18nName();
        $data['description'] = $live->getDescription();
        $data['i18nDescription'] = $live->getI18nDescription();

        return $data;
    }

    private function createStreamsForChannel(Live $live): array
    {
        $url = $this->liveService->generateHlsUrl($live);
        if (false === strpos($url, 'https')) {
            $url = 'https:'.$url;
        }

        $dataStream = $this->streamsManifest->buildDataLive([$url], 'video/mp4');
        $dataStream['preview'] = '';
        $dataStream['content'] = 'presenter';
        $dataStream['role'] = 'mainAudio';
        $data[] = $dataStream;

        return $data;
    }
}
