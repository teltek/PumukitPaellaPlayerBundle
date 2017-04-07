<?php

namespace Pumukit\PaellaPlayerBundle\Twig;

use Symfony\Component\Routing\RequestContext;
use Pumukit\SchemaBundle\Document\Broadcast;
use Pumukit\SchemaBundle\Document\EmbeddedBroadcast;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Services\MaterialService;
use Pumukit\SchemaBundle\Services\PicService;
use Pumukit\WebTVBundle\Services\LinkService;
use Doctrine\ODM\MongoDB\DocumentManager;

class PumukitExtension extends \Twig_Extension
{
    /**
     * @var RequestContext
     */
    protected $container;

    public function __construct($container)
    {
        $container = $container;
    }

    public function getName()
    {
        return 'pumukit_paellaplayer_extension';
    }

    /**
     * Get functions.
     */
    public function getFunctions()
    {
        return array(
            new \Twig_SimpleFunction('getPaellaLayout', array($this, 'getPaellaLayout', ['needs_environment' => true])),
        );
    }

    /**
     * @param MultimediaObject $mmobj Multimedia object to get the paella layout from
     *
     * @return string
     */
    public function getPaellaLayout($mmobj, $request)
    {
        $paellaLayout = 'professor_slide';

        if ($mmobj->getProperty('opencastinvert')) {
            $paellaLayout = 'slide_professor';
        }

        $paellaLayout = $request->query->get('paella_layout', $paellaLayout);

        return $paellaLayout;
    }
}
