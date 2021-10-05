# Paella Player Bundle

Bundle based on [Symfony](http://symfony.com/) to work with the [PuMuKIT Video Platform](https://github.com/pumukit/PuMuKIT/blob/4.0.x/README.md).

This bundle overrides the [Pumukit Player Bundle](https://github.com/pumukit/PuMuKIT/tree/master/src/Pumukit/PlayerBundle). It adds a Paella Player to the WebTV Portal to be used instead of the default [Player Bundle](https://github.com/pumukit/PuMuKIT/tree/master/src/Pumukit/PlayerBundle)

```bash
composer require teltek/pumukit-paella-player-bundle
```

The base Player needs to be uninstalled in order for the Paella Player to work properly:

Remove the next line from config/bundles.php
```
Pumukit\PlayerBundle\PumukitPlayerBundle::class => ['all' => true],
```

Remove the next lines from config/routes/annotations.yaml
```
pumukit_player:
  resource: "@PumukitPlayerBundle/Resources/config/routing.yml"
  prefix:   /
```

Remove file config/packages/pumukit_player.yaml

Add PaellaPlayer line from config/bundles.php
```
Pumukit\PaellaPlayerBundle\PumukitPaellaPlayerBundle::class => ['all' => true],
```

Add PaellaPlayer lines on config/routes/annotations.yaml
```
pumukit_player:
  resource: "@PumukitPaellaPlayerBundle/Resources/config/routing.yml"
  prefix:   /
```

Then execute the following commands

```bash
$ php app/console cache:clear
$ php app/console cache:clear --env=prod
$ php app/console assets:install
```
