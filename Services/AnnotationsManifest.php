<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Services;

use Doctrine\ODM\MongoDB\DocumentManager;
use Pumukit\SchemaBundle\Document\Annotation;
use Pumukit\SchemaBundle\Document\MultimediaObject;

class AnnotationsManifest
{
    protected const TRIMMING_TYPE = 'paella/trimming';
    protected const BREAK_TYPE = 'paella/breaks';
    protected const MARKS_TYPE = 'paella/marks';

    protected const SOFT_EDITING_PROPERTY = 'soft-editing-duration';
    protected $documentManager;

    public function __construct(
        DocumentManager $documentManager
    ) {
        $this->documentManager = $documentManager;
    }

    public function create(MultimediaObject $multimediaObject): array
    {
        return $this->processAnnotations($multimediaObject);
    }

    private function processAnnotations(MultimediaObject $multimediaObject): array
    {
        $annotations = $this->getAnnotationsForMultimediaObject($multimediaObject);
        if (!$annotations) {
            return [];
        }

        foreach ($annotations as $annotation) {
            if (self::BREAK_TYPE === $annotation->getType()) {
                $breaksAnnotations[] = $this->processBreakAnnotation($annotation);
            }
            if (self::MARKS_TYPE === $annotation->getType()) {
                $marksAnnotations[] = $this->processMarkAnnotation($annotation);
            }
            if (self::TRIMMING_TYPE === $annotation->getType()) {
                $trimmingAnnotations = $this->processTrimmingAnnotation($annotation, $multimediaObject);
            }
        }

        $result = array_merge($breaksAnnotations[0], $marksAnnotations, $trimmingAnnotations);

        $annotationsResult = [];
        foreach ($result as $element) {
            if (array_key_exists('start', $element)) {
                $annotationsResult[] = $element;
            }
        }

        if (empty($annotationsResult)) {
            return [];
        }

        usort($annotationsResult, static function ($a, $b) {
            return $a['start'] <=> $b['start'];
        });

        return $annotationsResult;
    }

    private function getAnnotationsForMultimediaObject(MultimediaObject $multimediaObject)
    {
        return $this->documentManager->getRepository(Annotation::class)->findBy([
            'multimediaObject' => $multimediaObject->getId(),
        ]);
    }

    private function processBreakAnnotation(Annotation $annotation): array
    {
        $breaks = $this->parseValue($annotation->getValue());

        if (!$this->validateContentValue($breaks, 'breaks')) {
            return [];
        }

        foreach ($breaks['breaks'] as $break) {
            if (!isset($break['s']) || !isset($break['e'])) {
                continue;
            }
            $elements[] = [
                'start' => $break['s'],
                'end' => $break['e'],
            ];
        }

        return $elements;
    }

    private function processMarkAnnotation(Annotation $annotation): array
    {
        $marks = $this->parseValue($annotation->getValue());

        if (!$this->validateContentValue($marks, 'marks')) {
            return [];
        }

        foreach ($marks['marks'] as $mark) {
            if (!isset($mark['s']) || !isset($mark['e'])) {
                continue;
            }
            $elements[] = [
                'start' => $mark['s'],
                'end' => $mark['e'],
                'content' => $mark['content'],
            ];
        }

        return [];
    }

    private function processTrimmingAnnotation(Annotation $annotation, MultimediaObject $multimediaObject): array
    {
        $value = $this->parseValue($annotation->getValue());

        if (!$this->validateContentValue($value, 'trimming')) {
            return [];
        }

        $trimming[] = [
            'start' => 0,
            'end' => $value['trimming']['start'],
        ];

        $end = $multimediaObject->getDisplayTrack()->getDuration();
        $trimming[] = [
            'start' => $value['trimming']['end'],
            'end' => $end,
        ];

        return $trimming;
    }

    private function validateContentValue(array $elements, string $key): bool
    {
        if (!isset($elements[$key]) || (isset($elements[$key]) && empty($elements[$key]))) {
            return false;
        }

        return true;
    }

    private function parseValue(string $value): array
    {
        return json_decode($value, true);
    }
}
