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
    $endpoint = isset($this->getParameter('pumukit_paella')['endpoint']) ? $this->getParameter('pumukit_paella')['endpoint'] : null;
    $auth = isset($this->getParameter('pumukit_paella')['auth']) ? $this->getParameter('pumukit_paella')['auth'] : null;

    $jsonData = $this->renderView('PumukitBasePlayerBundle:Conf:conf.json.twig', array('endpoint' => $endpoint, 'auth' => $auth));

    return new Response($jsonData, 200, array('Content-Type'=>'application/json'));
  }

}
