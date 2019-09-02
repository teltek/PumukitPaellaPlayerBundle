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
        $paellaLayout = 'professor_slide';

        if ($mmobj->getProperty('opencastinvert')) {
            $paellaLayout = 'slide_professor';
        }

        if ($mmobj->getProperty('paellalayout')) {
            $paellaLayout = $mmobj->getProperty('paellalayout');
        }

        return $request->query->get('paella_layout', $paellaLayout);
    }
}
