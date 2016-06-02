<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Pumukit\SchemaBundle\Document\Series;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Pumukit\WebTVBundle\Controller\WebTVController;

class PlaylistController extends Controller implements WebTVController
{
    /**
     * @Route("/playlist/{id}", name="pumukit_seriesplaylist_prettyIndex", defaults={"no_channels": true} )
     *
     * In case we want to use the 'pretty' url (like for embedding to an iframe).
     */
    public function prettyIndexAction(Series $series, Request $request)
    {
        return $this->redirectWithMmobj($series, $request);
    }

    /**
     * @Route("/playlist", name="pumukit_seriesplaylist_index", defaults={"no_channels": true} )
     * @Template("PumukitPaellaPlayerBundle:PaellaPlayer:player.html.twig")
     */
    public function indexAction(Request $request)
    {
        $mmobjId = $request->get('videoId');
        $seriesId = $request->get('playlistId');

        $series = $this->get('doctrine_mongodb.odm.document_manager')
                       ->getRepository('PumukitSchemaBundle:Series')
                       ->find($seriesId);
        if(!$series){
            throw $this->createNotFoundException("Not series found with id: $seriesId");
        }

        if(!$mmobjId) {
            //If the player has no mmobjId, we should provide it ourselves.
            return $this->redirectWithMmobj($series, $request);
        }

        $playlistService = $this->get('pumukit_baseplayer.seriesplaylist');
        $mmobj = $playlistService->getMmobjFromIdAndPlaylist($mmobjId, $series);

        if(!$mmobj)
            throw $this->createNotFoundException("Not mmobj found with the id: $mmobjId as part of the series with id: $seriesId");

        return array(
            'autostart' => $request->query->get('autostart', 'false'),
            'object' => $series,
            'multimediaObject' => $mmobj,
            'responsive' => true,
        );
    }
    private function redirectWithMmobj(Series $series, Request $request)
    {
        $playlistService = $this->get('pumukit_baseplayer.seriesplaylist');
        $mmobj = $playlistService->getPlaylistFirstMmobj($series);

        if(!$mmobj)
            throw $this->createNotFoundException("Not mmobj found for the playlist with id: {$series->getId()}");
        $redirectUrl = $this->generateUrl(
            'pumukit_seriesplaylist_index',
            array(
                'playlistId' => $series->getId(),
                'videoId' => $mmobj->getId(),
                'autostart' => $request->query->get('autostart', 'false'),
            )
        );
        return $this->redirect($redirectUrl);
    }
}
