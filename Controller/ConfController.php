<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;

class ConfController extends Controller
{
    /**
     * @return JsonResponse
     * @Route("/paella/config.json", name="paella_player_config")
     */
    public function confAction(Request $request)
    {
        $endpoint = $this->getParameter('pumukitpaella.xapi_endpoint');
        $auth = $this->getParameter('pumukitpaella.xapi_auth');
        $accessControlClass = $this->getParameter('pumukitpaella.access_control_class');

        $id = $request->get('id');
        $dm = $this->container->get('doctrine_mongodb')->getManager();
        $mmobj = $dm->getRepository('PumukitSchemaBundle:MultimediaObject')->findOneBy(array('_id' => new \MongoId($id)));
        $folders_profiles = 'config/profiles';
        if ($mmobj->getProperty('personalrecorder')) {
            $folders_profiles = 'config/profiles/pr';
        }

        $jsonData = $this->renderView('PumukitBasePlayerBundle:Conf:conf.json.twig', array('xapi_endpoint' => $endpoint, 'xapi_auth' => $auth, 'access_control_class' => $accessControlClass, 'folders_profiles' => $folders_profiles));

        return new JsonResponse($jsonData);
    }
}
