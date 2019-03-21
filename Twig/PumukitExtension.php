<?php

namespace Pumukit\PaellaPlayerBundle\Twig;

use Symfony\Component\Routing\RequestContext;
use Pumukit\SchemaBundle\Document\MultimediaObject;

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

        if ($mmobj->getProperty('paellalayout')) {
            $paellaLayout = $mmobj->getProperty('paellalayout');
        }

        $paellaLayout = $request->query->get('paella_layout', $paellaLayout);

        return $paellaLayout;
    }
}
