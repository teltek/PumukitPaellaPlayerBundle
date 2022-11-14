<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Pumukit\SchemaBundle\Document\MultimediaObject;

class VoDManifest
{
    protected $metadataManifest;
    protected $streamsManifest;
    protected $frameListManifest;
    protected $captionsManifest;
    protected $customManifest;
    protected $annotationsManifest;

    public function __construct(
        MetadataManifest $metadataManifest,
        StreamsManifest $streamsManifest,
        FrameListManifest $frameListManifest,
        CaptionsManifest $captionsManifest,
        CustomManifest $customManifest,
        AnnotationsManifest $annotationsManifest
    ) {
        $this->metadataManifest = $metadataManifest;
        $this->streamsManifest = $streamsManifest;
        $this->frameListManifest = $frameListManifest;
        $this->captionsManifest = $captionsManifest;
        $this->customManifest = $customManifest;
        $this->annotationsManifest = $annotationsManifest;
    }

    public function create(MultimediaObject $multimediaObject, ?string $trackId): array
    {
        $data['metadata'] = $this->metadataManifest->create($multimediaObject);
        $data = $this->customManifest->completeManifestData($multimediaObject, $data);
        $data['breaks'] = $this->annotationsManifest->create($multimediaObject);
        $data['streams'] = $this->streamsManifest->createStreamsForVoD($multimediaObject, $trackId)['streams'];
        $data['frameList'] = $this->frameListManifest->create($multimediaObject);
        $data['captions'] = $this->captionsManifest->create($multimediaObject);

        return $data;
    }
}
