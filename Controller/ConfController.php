<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

class ConfController extends Controller
{
  /**
  *
  * @return JsonResponse
  * @Route("/paella/config.json", name="paella_player_config")
  */
  public function confAction(Request $request)
  {
    $endpoint = $this->getParameter('pumukitpaella.xapi_endpoint');
    $auth =  $this->getParameter('pumukitpaella.xapi_auth');

    $jsonData = $this->renderView('PumukitBasePlayerBundle:Conf:conf.json.twig', array('xapi_endpoint' => $endpoint, 'xapi_auth' => $auth));

    return new Response($jsonData, 200, array('Content-Type'=>'application/json'));
  }

}
