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
            ->booleanNode('force_dual')
              ->defaultValue(false)
              ->info('If true never send SBS')
            ->end()
            ->scalarNode('custom_css_url')
              ->defaultValue(null)
              ->info('Custom CSS URL')
            ->end()
            ->scalarNode('logo')
              ->defaultValue(null)
              ->info('Custom logo URL')
            ->end()
          ->end();

        return $treeBuilder;
    }
}
