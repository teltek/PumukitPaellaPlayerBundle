<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Pumukit\SchemaBundle\Document\EmbeddedBroadcast;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Pumukit\SchemaBundle\Document\Track;
use Pumukit\CoreBundle\Controller\PersonalController;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class PaellaRepositoryController extends Controller implements PersonalController
{
    /**
     * @Route("/paellarepository/{id}.{_format}", defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellarepository/{secret}.{_format}", defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     * @Method("GET")
     */
    public function indexAction(MultimediaObject $mmobj, Request $request)
    {

        $serializer = $this->get('serializer');
        $paellaDataService = $this->get('pumukitpaellaplayer.paelladata');
        $criteria = array('embeddedBroadcast.type' => array('$eq' => EmbeddedBroadcast::TYPE_PUBLIC));
        $data = $paellaDataService->getPaellaMmobjData($mmobj, $request, $criteria);
        $response = $serializer->serialize($data, $request->getRequestFormat());

        return new Response($response);
    }

    /**
     * @Route("/paellaplaylist/{id}.{_format}", defaults={"_format"="json", "no_channels":true}, requirements={"_format": "json|xml"})
     * @Route("/secret/paellaplaylist/{secret}.{_format}", defaults={"_format":"json", "show_hide":true, "no_channels":true}, requirements={"_format": "json|xml"})
     * @Method("GET")
     */
    public function playlistAction(Series $series, Request $request)
    {
        $serializer = $this->get('serializer');
        $paellaDataService = $this->get('pumukitpaellaplayer.paelladata');
        $criteria = array('embeddedBroadcast.type' => array('$eq' => EmbeddedBroadcast::TYPE_PUBLIC));
        $data = $paellaDataService->getPaellaPlaylistData($series, $request, $criteria);
        $response = $serializer->serialize($data, $request->getRequestFormat());

        return new Response($response);
    }
}
