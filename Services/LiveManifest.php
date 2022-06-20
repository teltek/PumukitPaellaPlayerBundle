<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Pumukit\SchemaBundle\Document\MultimediaObject;

class LiveManifest
{
    public function create(MultimediaObject $multimediaObject): array
    {
        return $this->metadataManifest->create($multimediaObject);
    }
}
