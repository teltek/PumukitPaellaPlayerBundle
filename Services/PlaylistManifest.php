<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectIdInterface;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Pumukit\SchemaBundle\Services\MultimediaObjectService;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class PlaylistManifest
{
    protected $documentManager;
    protected $VoDManifest;
    protected $urlGenerator;
    protected $multimediaObjectService;

    public function __construct(
        DocumentManager $documentManager,
        VoDManifest $VoDManifest,
        UrlGeneratorInterface $urlGenerator,
        MultimediaObjectService $multimediaObjectService
    ) {
        $this->VoDManifest = $VoDManifest;
        $this->documentManager = $documentManager;
        $this->urlGenerator = $urlGenerator;
        $this->multimediaObjectService = $multimediaObjectService;
    }

    public function create(Series $series, int $videoPosition, string $pathInfo): array
    {
        if (!$series->isPlaylist()) {
            throw new \Exception('It isnt playlist.');
        }

        $multimediaObjects = $this->getMultimediaObjectsPlayable(
            $series->getPlaylist()->getMultimediaObjectsIdList()
        );

        if ($videoPosition > count($multimediaObjects)) {
            $videoPosition = 0;
        }

        $multimediaObject = $this->documentManager->getRepository(MultimediaObject::class)->findoneBy([
            '_id' => $multimediaObjects[$videoPosition],
        ]);

        $generatedVodManifest = $this->VoDManifest->create($multimediaObject, null);

        $generatedVodManifest['playlist'] = $this->generatePlaylistMetadata($series, $videoPosition, $pathInfo);

        return $generatedVodManifest;
    }

    private function generatePlaylistMetadata(Series $series, int $videoPosition, string $pathInfo): array
    {
        $data = ['playlistPos' => $videoPosition];
        $data['videos'] = $this->generateBasicMetadataForVideos($series, $pathInfo);

        return $data;
    }

    private function generateBasicMetadataForVideos(Series $series, string $pathInfo): array
    {
        $multimediaObjects = $this->getMultimediaObjectsPlayable(
            $series->getPlaylist()->getMultimediaObjectsIdList()
        );

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

    private function generateManifestURL(Series $series, ObjectIdInterface $multimediaObjectId, int $position, string $pathInfo): string
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

    private function getMultimediaObjectsPlayable(array $multimediaObjects): array
    {
        $elements = [];
        foreach ($multimediaObjects as $multimediaObject) {
            $element = $this->documentManager->getRepository(MultimediaObject::class)->findOneBy([
                '_id' => $multimediaObject,
            ]);

            if ($element instanceof MultimediaObject && $this->multimediaObjectService->isPlayableOnPlaylist($element)) {
                $elements[] = $multimediaObject;
            }
        }

        return $elements;
    }
}
