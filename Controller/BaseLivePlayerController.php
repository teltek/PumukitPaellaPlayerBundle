<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Live;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class BaseLivePlayerController extends AbstractController
{
    /**
     * @Route("/livevideoplayer/{id}", name="pumukit_livevideoplayer_index")
     * @Template("@PumukitPaellaPlayer/PaellaPlayer/live.html.twig")
     */
    public function indexAction(Request $request, MultimediaObject $multimediaObject)
    {
        return [
            'multimediaObject' => $multimediaObject,
            'object' => $multimediaObject,
            'event' => $multimediaObject->getEmbeddedEvent(),
        ];
    }

    /**
     * @Route("/live/channel/videoplayer/{id}", name="pumukit_live_channel_videoplayer")
     * @Template("@PumukitPaellaPlayer/PaellaPlayer/live.html.twig")
     */
    public function fromLiveAction(Request $request, Live $live)
    {
        return [
            'live' => $live,
            'object' => $live,
        ];
    }
}
