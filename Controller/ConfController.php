<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class ConfController.
 */
class ConfController extends Controller
{
    /**
     * @Route("/paella/config.json", name="paella_player_config")
     *
     * @param Request $request
     *
     * @return Response
     */
    public function confAction(Request $request)
    {
        $endpoint = $this->getParameter('pumukitpaella.xapi_endpoint');
        $auth = $this->getParameter('pumukitpaella.xapi_auth');
        $accessControlClass = $this->getParameter('pumukitpaella.access_control_class');
        $footprints = $this->getParameter('pumukitpaella.footprints');

        $id = $request->get('id');
        $dm = $this->container->get('doctrine_mongodb')->getManager();
        $folders_profiles = 'config/profiles';
        if ($id && preg_match('/^[0-9a-z]{24}$/', $id)) {
            $mmobj = $dm->getRepository('PumukitSchemaBundle:MultimediaObject')->findOneBy(
                ['_id' => new \MongoId($id)]
            );

            if ($mmobj->getProperty('personalrecorder')) {
                $folders_profiles = 'config/profiles/pr';
            }
        }
        if (strpos($request->headers->get('referer'), 'advanced')) {
            $folders_profiles = 'config/profiles/advanced';
        }

        $jsonData = $this->renderView(
            'PumukitPaellaPlayerBundle:Conf:conf.json.twig',
            [
                'xapi_endpoint' => $endpoint,
                'xapi_auth' => $auth,
                'access_control_class' => $accessControlClass,
                'footprints' => $footprints,
                'folders_profiles' => $folders_profiles,
            ]
        );

        return new Response($jsonData, 200, ['Content-Type' => 'application/json']);
    }
}
