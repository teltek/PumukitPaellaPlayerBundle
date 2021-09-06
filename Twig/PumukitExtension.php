<?php

namespace Pumukit\PaellaPlayerBundle\Twig;

use Pumukit\SchemaBundle\Document\MultimediaObject;
use Symfony\Component\Routing\RequestContext;

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
        return [
            new \Twig_SimpleFunction('getPaellaLayout', [$this, 'getPaellaLayout', ['needs_environment' => true]]),
        ];
    }

    /**
     * @param MultimediaObject $mmobj   Multimedia object to get the paella layout from
     * @param mixed            $request
     *
     * @return string
     */
    public function getPaellaLayout($mmobj, $request)
    {
        $paellaLayout = 'presenter_presentation';

        if ($mmobj->getProperty('opencastinvert')) {
            $paellaLayout = 'presenter_presentation';
        }

        if ($mmobj->getProperty('paellalayout')) {
            $paellaLayout = $mmobj->getProperty('paellalayout');
            switch($paellaLayout) {
                case "professor_slide":
                    $paellaLayout = "presenter_presentation";
                    break;
                case "professor":
                    $paellaLayout = "presenter";
                    break;
                case "slide":
                    $paellaLayout = "presentation";
                    break;
            }
        }

        return $request->query->get('paella_layout', $paellaLayout);
    }
}
