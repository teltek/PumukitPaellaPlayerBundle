<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Pumukit\PaellaPlayerBundle\PumukitPaellaPlayerBundle;
use Pumukit\SchemaBundle\Document\MultimediaObject;

class CustomManifest
{
    public function completeManifestData(MultimediaObject $multimediaObject, array $data): array
    {
        if (!$this->checkManifestData($data)) {
            throw new \Exception('Malformed manifest to add custom properties');
        }

        $data = $this->addIntroManifestURL($multimediaObject, $data);

        return $this->addTailManifestURL($multimediaObject, $data);
    }

    private function checkManifestData(array $data): bool
    {
        return isset($data['metadata']);
    }

    private function addIntroManifestURL(MultimediaObject $multimediaObject, array $data): array
    {
        $head = $multimediaObject->getVideoHead();
        if (!$head) {
            return $data;
        }

        $data['intro'] = $this->generatePaellaRepositoryURL($head);

        return $data;
    }

    private function addTailManifestURL(MultimediaObject $multimediaObject, array $data): array
    {
        $tail = $multimediaObject->getVideoTail();
        if (!$tail) {
            return $data;
        }

        $data['tail'] = $this->generatePaellaRepositoryURL($tail);

        return $data;
    }

    private function generatePaellaRepositoryURL(string $videoID): string
    {
        return '/'.PumukitPaellaPlayerBundle::paellaRepositoryPath().'/'.$videoID;
    }
}
