<?php

declare(strict_types=1);

namespace Pumukit\PaellaPlayerBundle\Controller;

use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use PHPUnit\Util\Json;
use Pumukit\CoreBundle\Controller\PersonalControllerInterface;
use Pumukit\CoreBundle\Services\SerializerService;
use Pumukit\PaellaPlayerBundle\Services\ChannelManifest;
use Pumukit\PaellaPlayerBundle\Services\LiveManifest;
use Pumukit\PaellaPlayerBundle\Services\PlaylistManifest;
use Pumukit\PaellaPlayerBundle\Services\VoDManifest;
use Pumukit\SchemaBundle\Document\Live;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PaellaRepositoryController extends AbstractController implements PersonalControllerInterface
{
    private $documentManager;
    private $serializer;
    private $playlistManifest;
    private $voDManifest;
    private $liveManifest;
    private $channelManifest;

    public function __construct(
        DocumentManager $documentManager,
        SerializerService $serializer,
        PlaylistManifest $playlistManifest,
        VoDManifest $voDManifest,
        LiveManifest $liveManifest,
        ChannelManifest $channelManifest
    ) {
        $this->documentManager = $documentManager;
        $this->serializer = $serializer;
        $this->playlistManifest = $playlistManifest;
        $this->voDManifest = $voDManifest;
        $this->liveManifest = $liveManifest;
        $this->channelManifest = $channelManifest;
    }

    /**
     * @Route("/paellarepository/{id}.{_format}", methods={"GET"}, defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellarepository/{secret}.{_format}", methods={"GET"}, defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     */
    public function indexAction(Request $request, string $id): Response
    {
        $multimediaObject = $this->documentManager->getRepository(MultimediaObject::class)->findOneBy([
            '_id' => new ObjectId($id),
        ]);

        if ($multimediaObject instanceof MultimediaObject) {
            if ($multimediaObject->isLive()) {
                $data = $this->liveManifest->create($multimediaObject);
            } else {
                $data = $this->voDManifest->create($multimediaObject, $request->query->get('track_id'));
            }
            $response = $this->serializer->dataSerialize($data, $request->getRequestFormat());

            return new Response($response);
        }

        $live = $this->documentManager->getRepository(Live::class)->findOneBy([
            '_id' => new ObjectId($id),
        ]);

        if ($live instanceof Live) {
            $data = $this->channelManifest->create($live);
            $response = $this->serializer->dataSerialize($data, $request->getRequestFormat());

            return new Response($response);
        }

        throw new \Exception('Element not found');
    }

    /**
     * @Route("/paellaplaylist/{id}.{_format}", methods={"GET"}, defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellaplaylist/{secret}.{_format}", methods={"GET"}, defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     */
    public function playlistAction(Request $request, Series $series): Response
    {
        $data = $this->playlistManifest->create($series, $request->query->getInt('videoPos') ?? 0, $request->getPathInfo());
        $response = $this->serializer->dataSerialize($data, $request->getRequestFormat());

        return new Response($response);
    }
}
