<?php

namespace Pumukit\PaellaPlayerBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{
    /**
     * {@inheritdoc}
     */
    public function getConfigTreeBuilder()
    {
        $treeBuilder = new TreeBuilder();
        $rootNode = $treeBuilder->root('pumukit_paella_player');

        $rootNode
          ->children()
            ->scalarNode('custom_css_url')
              ->defaultValue(null)
              ->info('Custom CSS URL')
            ->end()
            ->scalarNode('logo')
              ->defaultValue(null)
              ->info('Custom logo URL')
            ->end()
            ->scalarNode('xapi_endpoint')
              ->defaultValue(null)
              ->info('LRS endpoint for xAPI')
            ->end()
            ->scalarNode('xapi_auth')
              ->defaultValue(null)
              ->info('LRS auth token for xAPI')
            ->end()
            ->scalarNode('access_control_class')
              ->defaultValue("paella.AccessControl")
              ->info('Paella accessControlClass')
            ->end()
          ->end();

        return $treeBuilder;
    }
}
