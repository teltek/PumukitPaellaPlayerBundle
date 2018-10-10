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

        if (!$track && $multimediaObject->isMultistream()) {
            $tracks = $multimediaObject->getFilteredTracksWithTags(array('presenter/delivery', 'presentation/delivery'));
        } else {
            $tracks = array($track);
        }

        return array(
            'autostart' => $this->getAutoStart($request),
            'intro' => $this->getIntroForMultimediaObject($multimediaObject->getProperty('intro'), $request->query->get('intro')),
            'custom_css_url' => $this->container->getParameter('pumukitpaella.custom_css_url'),
            'logo' => $this->container->getParameter('pumukitpaella.logo'),
            'multimediaObject' => $multimediaObject,
            'object' => $multimediaObject,
            'when_dispatch_view_event' => $this->getParameterWithDefaultValue('pumukitplayer.when_dispatch_view_event', 'on_load'),
            'tracks' => $tracks,
            'opencast_host' => $this->getParameterWithDefaultValue('pumukit_opencast.host', ''),
        );
    }

    /**
     * @Route("/videoplayer/{id}", name="pumukit_videoplayer_index" )
     * @Route("/videoplayer/opencast/{id}", name="pumukit_videoplayer_opencast" )
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     */
    public function indexAction(MultimediaObject $multimediaObject, Request $request)
    {
        $request = $this->container->get('request_stack')->getMasterRequest();

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

        if (!$track && $multimediaObject->isMultistream()) {
            $tracks = $multimediaObject->getFilteredTracksWithTags(array('presenter/delivery', 'presentation/delivery'));
        } else {
            $tracks = array($track);
        }

        return array(
            'autostart' => $this->getAutoStart($request),
            'intro' => $this->getIntroForMultimediaObject($multimediaObject->getProperty('intro'), $request->query->get('intro')),
            'custom_css_url' => $this->container->getParameter('pumukitpaella.custom_css_url'),
            'logo' => $this->container->getParameter('pumukitpaella.logo'),
            'multimediaObject' => $multimediaObject,
            'object' => $multimediaObject,
            'when_dispatch_view_event' => $this->getParameterWithDefaultValue('pumukitplayer.when_dispatch_view_event', 'on_load'),
            'tracks' => $tracks,
            'opencast_host' => $this->getParameterWithDefaultValue('pumukit_opencast.host', ''),
        );
    }

    private function getAutoStart($request)
    {
        $autoStart = $request->query->get('autostart', 'false');

        return $autoStart;
    }

    private function getParameterWithDefaultValue($name, $default = null)
    {
        if ($this->container->hasParameter($name)) {
            return $this->container->getParameter($name);
        }

        return $default;
    }

    /**
     * @deprecated: compatibility layer. Remove with PuMuKIT version 2.5.x
     */
    private function getIntroForMultimediaObject($introProperty = null, $introParameter = null)
    {
        if (!$this->has('pumukit_baseplayer.intro')) {
            return $this->getIntro($introParameter);
        }

        $service = $this->get('pumukit_baseplayer.intro');
        if (method_exists($service, 'getIntroForMultimediaObject')) {
            return $service->getIntroForMultimediaObject($introProperty, $introParameter);
        }

        return $this->get('pumukit_baseplayer.intro')->getIntro($introParameter);
    }
}
