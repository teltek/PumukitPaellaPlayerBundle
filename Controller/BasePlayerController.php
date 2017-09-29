<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Pumukit\BasePlayerBundle\Controller\BasePlayerController as BasePlayerControllero;

class BasePlayerController extends BasePlayerControllero
{
    /**
     * @Route("/videoplayer/magic/{secret}", name="pumukit_videoplayer_magicindex")
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     */
    public function magicAction(MultimediaObject $multimediaObject, Request $request)
    {
        if (!$request->query->has('secret')) {
            return $this->redirect($this->generateUrl('pumukit_videoplayer_magicindex', array('id' => $multimediaObject->getId(), 'secret' => $multimediaObject->getSecret())).'&secret='.$multimediaObject->getSecret());
        }

        $response = $this->testBroadcast($multimediaObject, $request);
        if ($response instanceof Response) {
            return $response;
        }

        $track = $request->query->has('track_id') ?
               $multimediaObject->getTrackById($request->query->get('track_id')) :
               $multimediaObject->getDisplayTrack();

        if ($track && $track->containsTag('download')) {
            return $this->redirect($track->getUrl());
        }

        if ($url = $multimediaObject->getProperty('externalplayer')) {
            return $this->redirect($url);
        }

        //ADD LOGIC TO CHECK IF VIDEO IS MULTISTREAM (opencast)
        //Then just return several tracks.
        $tracks = array($track);

        return array('autostart' => $request->query->get('autostart', 'false'),
                     'intro' => $this->getIntro($request->query->get('intro')),
                     'custom_css_url' => $this->container->getParameter('pumukitpaella.custom_css_url'),
                     'multimediaObject' => $multimediaObject,
                     'object' => $multimediaObject,
                     'tracks' => $tracks, );
    }

    /**
     * @Route("/videoplayer/{id}", name="pumukit_videoplayer_index" )
     * @Route("/videoplayer/opencast/{id}", name="pumukit_videoplayer_opencast" )
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     */
    public function indexAction(MultimediaObject $multimediaObject, Request $request)
    {
        $response = $this->testBroadcast($multimediaObject, $request);
        if ($response instanceof Response) {
            return $response;
        }

        $track = $request->query->has('track_id') ?
               $multimediaObject->getTrackById($request->query->get('track_id')) :
               $multimediaObject->getDisplayTrack();

        if ($track && $track->containsTag('download')) {
            return $this->redirect($track->getUrl());
        }

        if ($url = $multimediaObject->getProperty('externalplayer')) {
            return $this->redirect($url);
        }

        //ADD LOGIC TO CHECK IF VIDEO IS MULTISTREAM (opencast)
        //Then just return several tracks.
        $tracks = array($track);

        // Add opencast_host to session because we need change domain on ajax url to get footprints.
        if ($this->container->hasParameter('pumukit_opencast.host')) {
            $session = $this->get('session');
            $session->set('opencast_host', $this->container->getParameter('pumukit_opencast.host'));
        }

        return array('autostart' => $request->query->get('autostart', 'false'),
                     'intro' => $this->getIntro($request->query->get('intro')),
                     'custom_css_url' => $this->container->getParameter('pumukitpaella.custom_css_url'),
                     'multimediaObject' => $multimediaObject,
                     'object' => $multimediaObject,
                     'tracks' => $tracks, );
    }
}
