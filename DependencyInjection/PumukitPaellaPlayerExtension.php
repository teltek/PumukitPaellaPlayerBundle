<?php

namespace Pumukit\PaellaPlayerBundle\DependencyInjection;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\DependencyInjection\Loader;

/**
 * This is the class that loads and manages your bundle configuration.
 *
 * To learn more see {@link http://symfony.com/doc/current/cookbook/bundles/extension.html}
 */
class PumukitPaellaPlayerExtension extends Extension
{
    /**
     * {@inheritdoc}
     */
    public function load(array $configs, ContainerBuilder $container)
    {
        $configuration = new Configuration();
        $config = $this->processConfiguration($configuration, $configs);

        $loader = new Loader\XmlFileLoader($container, new FileLocator(__DIR__.'/../Resources/config'));
        $loader->load('services.xml');

        $container->setParameter('pumukitpaella.custom_css_url', $config['custom_css_url']);
        $container->setParameter('pumukitpaella.logo', $config['logo']);
        $container->setParameter('pumukitpaella.xapi_endpoint', $config['xapi_endpoint']);
        $container->setParameter('pumukitpaella.xapi_auth', $config['xapi_auth']);
    }
}
