<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectIdInterface;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class PlaylistManifest
{
    protected $documentManager;
    protected $VoDManifest;
    protected $urlGenerator;
    protected $requestContextScheme;
    protected $requestContextHost;

    public function __construct(
        DocumentManager $documentManager,
        VoDManifest $VoDManifest,
        UrlGeneratorInterface $urlGenerator,
        string $requestContextScheme,
        string $requestContextHost
    ) {
        $this->VoDManifest = $VoDManifest;
        $this->documentManager = $documentManager;
        $this->urlGenerator = $urlGenerator;
        $this->requestContextScheme = $requestContextScheme;
        $this->requestContextHost = $requestContextHost;
    }

    public function create(Series $series, int $videoPosition, string $pathInfo)
    {
        if (!$series->isPlaylist()) {
            throw new \Exception('It isnt playlist.');
        }

        $multimediaObjects = $series->getPlaylist()->getMultimediaObjectsIdList();

        $multimediaObject = $this->documentManager->getRepository(MultimediaObject::class)->findoneBy([
            '_id' => $multimediaObjects[$videoPosition],
        ]);

        $generatedVodManifest = $this->VoDManifest->create($multimediaObject, null);

        $generatedVodManifest['playlist'] = $this->generatePlaylistMetadata($series, $videoPosition, $pathInfo);

        return $generatedVodManifest;
    }

    private function generatePlaylistMetadata(Series $series, int $videoPosition, string $pathInfo)
    {
        $data = ['playlistPos' => $videoPosition];
        $data['videos'] = $this->generateBasicMetadataForVideos($series, $pathInfo);

        return $data;
    }

    private function generateBasicMetadataForVideos(Series $series, string $pathInfo)
    {
        $multimediaObjects = $series->getPlaylist()->getMultimediaObjectsIdList();

        $data = [];

        $i = 0;
        foreach ($multimediaObjects as $multimediaObjectId) {
            $multimediaObject = $this->documentManager->getRepository(MultimediaObject::class)->findoneBy([
                '_id' => $multimediaObjectId,
            ]);
            $data[] = [
                'videoURL' => $this->generateManifestURL($series, $multimediaObjectId, $i, $pathInfo),
                'title' => $multimediaObject->getTitle(),
                'pos' => $i,
            ];

            ++$i;
        }

        return $data;
    }

    private function generateManifestURL(Series $series, ObjectIdInterface $multimediaObjectId, int $position, string $pathInfo)
    {
        $parameters = [
            'playlistId' => $series->getId(),
            'videoId' => (string) $multimediaObjectId,
            'videoPos' => $position,
            'autostart' => true,
        ];

        return urldecode($this->urlGenerator->generate(
            'pumukit_playlistplayer_paellaindex',
            $parameters,
            UrlGeneratorInterface::ABSOLUTE_URL
        ));
    }
}
