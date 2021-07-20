<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Pumukit\BasePlayerBundle\Controller\BasePlaylistController as BasePlaylistControllero;
use Pumukit\SchemaBundle\Document\EmbeddedBroadcast;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class BasePlaylistController extends BasePlaylistControllero
{
    /**
     * @Route("/playlist/{id}", name="pumukit_playlistplayer_index", defaults={"no_channels": true} )
     * @Route("/playlist/magic/{secret}", name="pumukit_playlistplayer_magicindex", defaults={"show_hide": true, "no_channels": true} )
     *
     * Added default indexAction and redirect to the paella route.
     *
     * @return Response|\Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function indexAction(Series $series, Request $request)
    {
        $mmobjId = $request->get('videoId');
        $videoPos = $request->get('videoPos');

        return $this->redirectWithMmobj($series, $request, $mmobjId, $videoPos);
    }

    /**
     * @Route("/playlist", name="pumukit_playlistplayer_paellaindex", defaults={"no_channels": true} )
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     *
     * In order to make things easier on the paella side, we drop the symfony custom urls.
     *
     * @throws \Doctrine\ODM\MongoDB\LockException
     * @throws \Doctrine\ODM\MongoDB\Mapping\MappingException
     *
     * @return array|Response|\Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function paellaIndexAction(Request $request)
    {
        $mmobjId = $request->get('videoId');
        $seriesId = $request->get('playlistId');
        $series = $this->get('doctrine_mongodb.odm.document_manager')
            ->getRepository('PumukitSchemaBundle:Series')
            ->find($seriesId)
        ;
        if (!$series) {
            return $this->return404Response("No playlist found with id: {$seriesId}");
        }

        if (!$mmobjId) {
            //If the player has no mmobjId, we should provide it ourselves.
            return $this->redirectWithMmobj($series, $request);
        }

        $playlistService = $this->get('pumukit_baseplayer.seriesplaylist');
        $criteria = ['embeddedBroadcast.type' => ['$eq' => EmbeddedBroadcast::TYPE_PUBLIC]];
        if (!$series->isPlaylist()) {
            $dm = $this->get('doctrine_mongodb')->getManager();
            $criteria = [
                'series' => new \MongoId($series->getId()),
                'embeddedBroadcast.type' => EmbeddedBroadcast::TYPE_PUBLIC,
                'type' => ['$ne' => MultimediaObject::TYPE_LIVE],
                'tracks.tags' => 'display',
            ];
            $mmobj = $dm->getRepository('PumukitSchemaBundle:MultimediaObject')->findOneBy($criteria, ['rank' => 'asc']);
        } else {
            $mmobj = $playlistService->getMmobjFromIdAndPlaylist($mmobjId, $series, $criteria);
        }

        if (!$mmobj) {
            return $this->return404Response("No playable multimedia object found with id: {$mmobjId} belonging to this playlist. ({$series->getTitle()})");
        }

        $opencastHost = '';
        if ($this->container->hasParameter('pumukit_opencast.host')) {
            $opencastHost = $this->container->getParameter('pumukit_opencast.host');
        }

        return [
            'autostart' => $request->query->get('autostart', 'false'),
            'intro' => $this->getIntro($request->query->get('intro')),
            'custom_css_url' => $this->container->getParameter('pumukitpaella.custom_css_url'),
            'logo' => $this->container->getParameter('pumukitpaella.logo'),
            'multimediaObject' => $mmobj,
            'object' => $series,
            'responsive' => true,
            'opencast_host' => $opencastHost,
        ];
    }

    /**
     * Use IntroService in the new version 1.3.x.
     *
     * @param null $introParameter
     *
     * @return bool|mixed
     */
    protected function getIntro($introParameter = null)
    {
        $hasIntro = $this->container->hasParameter('pumukit.intro');

        $showIntro = true;
        if (null !== $introParameter && false === filter_var($introParameter, FILTER_VALIDATE_BOOLEAN)) {
            $showIntro = false;
        }

        if ($hasIntro && $showIntro) {
            return $this->container->getParameter('pumukit.intro');
        }

        return false;
    }

    /**
     * Helper function to used to redirect when the mmobj id is not specified in the request.
     *
     * @param null $mmobjId
     * @param null $videoPos
     *
     * @return Response|\Symfony\Component\HttpFoundation\RedirectResponse
     */
    private function redirectWithMmobj(Series $series, Request $request, $mmobjId = null, $videoPos = null)
    {
        $playlistService = $this->get('pumukit_baseplayer.seriesplaylist');
        if (!$mmobjId) {
            $criteria = ['embeddedBroadcast.type' => ['$eq' => EmbeddedBroadcast::TYPE_PUBLIC]];
            if (!$series->isPlaylist()) {
                $dm = $this->get('doctrine_mongodb')->getManager();
                $criteria = [
                    'series' => new \MongoId($series->getId()),
                    'embeddedBroadcast.type' => EmbeddedBroadcast::TYPE_PUBLIC,
                    'type' => ['$ne' => MultimediaObject::TYPE_LIVE],
                    'tracks.tags' => 'display',
                ];
                $mmobj = $dm->getRepository('PumukitSchemaBundle:MultimediaObject')->findOneBy($criteria, ['rank' => 'asc']);
            } else {
                $mmobj = $playlistService->getPlaylistFirstMmobj($series, $criteria);
            }

            if (!$mmobj) {
                return $this->return404Response('This playlist does not have any playable multimedia objects.');
            }
            $mmobjId = $mmobj->getId();
            $videoPos = 0;
        }
        $redirectUrl = $this->generateUrl(
            'pumukit_playlistplayer_paellaindex',
            [
                'playlistId' => $series->getId(),
                'videoId' => $mmobjId,
                'videoPos' => $videoPos,
                'autostart' => $request->query->get('autostart', 'false'),
            ]
        );

        return $this->redirect($redirectUrl);
    }

    private function return404Response($message = '')
    {
        $params = [
            'message' => $message,
        ];
        $template = $this->renderView(
            'PumukitPaellaPlayerBundle:PaellaPlayer:404exception.html.twig',
            $params
        );

        return new Response($template, 404);
    }
}
