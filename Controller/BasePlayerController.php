<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Pumukit\BasePlayerBundle\Controller\BasePlayerController as BasePlayerControllero;
use Pumukit\BasePlayerBundle\Services\IntroService;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class BasePlayerController extends BasePlayerControllero
{
    /**
     * @Route("/videoplayer/magic/{secret}", name="pumukit_videoplayer_magicindex")
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     */
    public function magicAction(MultimediaObject $multimediaObject, Request $request)
    {
        if (!$request->query->has('secret')) {
            return $this->redirect($this->generateUrl('pumukit_videoplayer_magicindex', ['id' => $multimediaObject->getId(), 'secret' => $multimediaObject->getSecret()]).'&secret='.$multimediaObject->getSecret());
        }

        $embeddedBroadcastService = $this->get('pumukitschema.embeddedbroadcast');
        $password = $request->get('broadcast_password');
        $response = $embeddedBroadcastService->canUserPlayMultimediaObject($multimediaObject, $this->getUser(), $password);
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
            if (!$track) {
                return $this->redirect($url);
            }
        }

        if ($request->query->has('raw')) {
            return $this->render('PumukitPaellaPlayerBundle:BasePlayer:player.html.twig', [
                'autostart' => $this->getAutoStart($request),
                'autoplay_fallback' => $this->container->getParameter('pumukitpaella.autoplay'),
                'when_dispatch_view_event' => $this->getParameterWithDefaultValue('pumukitplayer.when_dispatch_view_event', 'on_load'),
                'multimediaObject' => $multimediaObject,
                'track' => $track,
            ]);
        }

        if (!$track && $multimediaObject->isMultistream()) {
            $tracks = $multimediaObject->getFilteredTracksWithTags(['presenter/delivery', 'presentation/delivery']);
        } else {
            $tracks = [$track];
        }

        /** @var IntroService */
        $basePlayerIntroService = $this->get('pumukit_baseplayer.intro');

        return [
            'autostart' => $this->getAutoStart($request),
            'autoplay_fallback' => $this->container->getParameter('pumukitpaella.autoplay'),
            'intro' => $basePlayerIntroService->getVideoIntroduction($multimediaObject),
            'custom_css_url' => $this->container->getParameter('pumukitpaella.custom_css_url'),
            'logo' => $this->container->getParameter('pumukitpaella.logo'),
            'multimediaObject' => $multimediaObject,
            'object' => $multimediaObject,
            'when_dispatch_view_event' => $this->getParameterWithDefaultValue('pumukitplayer.when_dispatch_view_event', 'on_load'),
            'tracks' => $tracks,
            'opencast_host' => $this->getParameterWithDefaultValue('pumukit_opencast.host', ''),
        ];
    }

    /**
     * @Route("/videoplayer/{id}", name="pumukit_videoplayer_index" )
     * @Route("/videoplayer/opencast/{id}", name="pumukit_videoplayer_opencast" )
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     */
    public function indexAction(MultimediaObject $multimediaObject, Request $request)
    {
        $request = $this->container->get('request_stack')->getMasterRequest();

        $embeddedBroadcastService = $this->get('pumukitschema.embeddedbroadcast');
        $password = $request->get('broadcast_password');
        $response = $embeddedBroadcastService->canUserPlayMultimediaObject($multimediaObject, $this->getUser(), $password);
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
            if (!$track) {
                return $this->redirect($url);
            }
        }

        if ($request->query->has('raw')) {
            return $this->render('PumukitPaellaPlayerBundle:BasePlayer:player.html.twig', [
                'autostart' => $this->getAutoStart($request),
                'autoplay_fallback' => $this->container->getParameter('pumukitpaella.autoplay'),
                'when_dispatch_view_event' => $this->getParameterWithDefaultValue('pumukitplayer.when_dispatch_view_event', 'on_load'),
                'multimediaObject' => $multimediaObject,
                'track' => $track,
            ]);
        }

        if (!$track && $multimediaObject->isMultistream()) {
            $tracks = $multimediaObject->getFilteredTracksWithTags(['presenter/delivery', 'presentation/delivery']);
        } else {
            $tracks = [$track];
        }

        /** @var IntroService */
        $basePlayerIntroService = $this->get('pumukit_baseplayer.intro');

        return [
            'autostart' => $this->getAutoStart($request),
            'autoplay_fallback' => $this->container->getParameter('pumukitpaella.autoplay'),
            'intro' => $basePlayerIntroService->getVideoIntroduction($multimediaObject),
            'custom_css_url' => $this->container->getParameter('pumukitpaella.custom_css_url'),
            'logo' => $this->container->getParameter('pumukitpaella.logo'),
            'multimediaObject' => $multimediaObject,
            'object' => $multimediaObject,
            'when_dispatch_view_event' => $this->getParameterWithDefaultValue('pumukitplayer.when_dispatch_view_event', 'on_load'),
            'tracks' => $tracks,
            'opencast_host' => $this->getParameterWithDefaultValue('pumukit_opencast.host', ''),
        ];
    }

    private function getAutoStart($request)
    {
        if ('disabled' === $this->container->getParameter('pumukitpaella.autoplay')) {
            return false;
        }

        $autoStart = $request->query->get('autostart', 'false');
        $userAgent = $request->headers->get('user-agent');
        if (false !== strpos($userAgent, 'Safari')) {
            if (false === strpos($userAgent, 'Chrome')) {
                $autoStart = false;
            }
        }

        return $autoStart;
    }

    private function getParameterWithDefaultValue($name, $default = null)
    {
        if ($this->container->hasParameter($name)) {
            return $this->container->getParameter($name);
        }

        return $default;
    }
}
