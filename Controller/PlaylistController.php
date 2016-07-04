<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Pumukit\BasePlayerBundle\Controller\BasePlaylistController;
use Pumukit\SchemaBundle\Document\EmbeddedBroadcast;
use Pumukit\SchemaBundle\Document\Series;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class PlaylistController extends BasePlaylistController
{
    /**
     * @Route("/playlist/{id}", name="pumukit_playlistplayer_index", defaults={"no_channels": true} )
     * @Route("/playlist/magic/{secret}", name="pumukit_playlistplayer_magicindex", defaults={"show_hide": true, "no_channels": true} )
     *
     * Added default indexAction and redirect to the paella route.
     */
    public function indexAction(Series $series, Request $request)
    {
        $mmobjId = $request->get('videoId');
        return $this->redirectWithMmobj($series, $request, $mmobjId);
    }

    /**
     * @Route("/playlist", name="pumukit_playlistplayer_paellaindex", defaults={"no_channels": true} )
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     *
     * In order to make things easier on the paella side, we drop the symfony custom urls.
     */
    public function paellaIndexAction(Request $request)
    {
        $mmobjId = $request->get('videoId');
        $seriesId = $request->get('playlistId');

        $series = $this->get('doctrine_mongodb.odm.document_manager')
                       ->getRepository('PumukitSchemaBundle:Series')
                       ->find($seriesId);
        if(!$series){
            $this->return404Response("No playlist found with id: $seriesId");
        }

        if(!$mmobjId) {
            //If the player has no mmobjId, we should provide it ourselves.
            return $this->redirectWithMmobj($series, $request);
        }

        $playlistService = $this->get('pumukit_baseplayer.seriesplaylist');
        $criteria = array('embeddedBroadcast.type' => array('$eq' => EmbeddedBroadcast::TYPE_PUBLIC));
        $mmobj = $playlistService->getMmobjFromIdAndPlaylist($mmobjId, $series, $criteria);

        if(!$mmobj)
            return $this->return404Response("No playable multimedia object found with id: $mmobjId belonging to this playlist. ({$series->getTitle()})");

        return array(
            'autostart' => $request->query->get('autostart', 'false'),
            'object' => $series,
            'multimediaObject' => $mmobj,
            'responsive' => true,
        );
    }

    /**
     * Helper function to used to redirect when the mmobj id is not specified in the request.
     */
    private function redirectWithMmobj(Series $series, Request $request, $mmobjId = null)
    {
        $playlistService = $this->get('pumukit_baseplayer.seriesplaylist');
        if(!$mmobjId) {
            $criteria = array('embeddedBroadcast.type' => array('$eq' => EmbeddedBroadcast::TYPE_PUBLIC));
            $mmobj = $playlistService->getPlaylistFirstMmobj($series, $criteria);
            if(!$mmobj)
                return $this->return404Response("This playlist does not have any playable multimedia objects.");
            $mmobjId = $mmobj->getId();
        }

        $redirectUrl = $this->generateUrl(
            'pumukit_playlistplayer_paellaindex',
            array(
                'playlistId' => $series->getId(),
                'videoId' => $mmobjId,
                'autostart' => $request->query->get('autostart', 'false'),
            )
        );
        return $this->redirect($redirectUrl);
    }

    private function return404Response($message = '')
    {
        $params = array(
            'message' => $message,
        );
        $template = $this->renderView(
            "PumukitPaellaPlayerBundle:PaellaPlayer:404exception.html.twig",
            $params
        );
        return new Response($template, 404);
        throw $this->createNotFoundException($message);
    }
}
