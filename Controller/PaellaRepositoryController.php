<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Pumukit\CoreBundle\Controller\PersonalControllerInterface;
use Pumukit\SchemaBundle\Document\EmbeddedBroadcast;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class PaellaRepositoryController.
 */
class PaellaRepositoryController extends Controller implements PersonalControllerInterface
{
    /**
     * @Route("/paellarepository/{id}.{_format}", defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellarepository/{secret}.{_format}", defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     * @Method("GET")
     *
     * @param MultimediaObject $mmobj
     * @param Request          $request
     *
     * @return Response
     */
    public function indexAction(MultimediaObject $mmobj, Request $request)
    {
        $serializer = $this->get('jms_serializer');
        $paellaDataService = $this->get('pumukitpaellaplayer.paelladata');
        $data = $paellaDataService->getPaellaMmobjData($mmobj, $request);
        $response = $serializer->serialize($data, $request->getRequestFormat());

        return new Response($response);
    }

    /**
     * @Route("/paellaplaylist/{id}.{_format}", defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellaplaylist/{secret}.{_format}", defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     * @Method("GET")
     *
     * @param Series  $series
     * @param Request $request
     *
     * @return Response
     */
    public function playlistAction(Series $series, Request $request)
    {
        $serializer = $this->get('jms_serializer');
        $paellaDataService = $this->get('pumukitpaellaplayer.paelladata');
        $criteria = [
            'embeddedBroadcast.type' => ['$eq' => EmbeddedBroadcast::TYPE_PUBLIC],
            'tracks' => ['$elemMatch' => ['tags' => 'display', 'hide' => false]],
        ];
        $data = $paellaDataService->getPaellaPlaylistData($series, $criteria);
        $response = $serializer->serialize($data, $request->getRequestFormat());

        return new Response($response);
    }
}
