<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Pumukit\SchemaBundle\Document\Track;
use Pumukit\VideoEditorBundle\Document\Annotation;
use Pumukit\WebTVBundle\Controller\WebTVController;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;

class PaellaRepositoryController extends Controller implements WebTVController
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
        $data = $paellaDataService->getPaellaMmobjData($mmobj, $request);
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
        $data = $paellaDataService->getPaellaPlaylistData($series, $request);
        $response = $serializer->serialize($data, $request->getRequestFormat());
        return new Response($response);
    }
}
