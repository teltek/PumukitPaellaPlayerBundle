<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use PHPUnit\Util\Json;
use Pumukit\CoreBundle\Controller\PersonalControllerInterface;
use Pumukit\CoreBundle\Services\SerializerService;
use Pumukit\PaellaPlayerBundle\Services\LiveManifest;
use Pumukit\PaellaPlayerBundle\Services\PaellaDataService;
use Pumukit\PaellaPlayerBundle\Services\VoDManifest;
use Pumukit\SchemaBundle\Document\EmbeddedBroadcast;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class PaellaRepositoryController extends AbstractController implements PersonalControllerInterface
{
    private $serializer;
    private $paellaDataService;
    private $voDManifest;
    private $liveManifest;

    public function __construct(
        SerializerService $serializer,
        PaellaDataService $paellaDataService,
        VoDManifest $voDManifest,
        LiveManifest $liveManifest
    ) {
        $this->serializer = $serializer;
        $this->paellaDataService = $paellaDataService;
        $this->voDManifest = $voDManifest;
        $this->liveManifest = $liveManifest;
    }

    /**
     * @Route("/paellarepository/{id}.{_format}", methods={"GET"}, defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellarepository/{secret}.{_format}", methods={"GET"}, defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     */
    public function indexAction(Request $request, MultimediaObject $multimediaObject): Response
    {
        if ($multimediaObject->isLive()) {
            $data = $this->liveManifest->create($multimediaObject);
        } else {
            $data = $this->voDManifest->create($multimediaObject, $request->query->get('track_id'));
        }
        $response = $this->serializer->dataSerialize($data, $request->getRequestFormat());

        return new Response($response);
    }

    /**
     * @Route("/paellaplaylist/{id}.{_format}", methods={"GET"}, defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellaplaylist/{secret}.{_format}", methods={"GET"}, defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     */
    public function playlistAction(Request $request, Series $series): Response
    {
        $criteria = [
            'embeddedBroadcast.type' => ['$eq' => EmbeddedBroadcast::TYPE_PUBLIC],
            'tracks' => ['$elemMatch' => ['tags' => 'display', 'hide' => false]],
        ];
        $data = $this->paellaDataService->getPaellaPlaylistData($series, $criteria);
        $response = $this->serializer->dataSerialize($data, $request->getRequestFormat());

        return new Response($response);
    }
}
