# Paella Player Bundle

Bundle based on [Symfony](http://symfony.com/) to work with the [PuMuKIT Video Platform](https://github.com/pumukit/PuMuKIT/blob/4.0.x/README.md).

This bundle overrides the [Pumukit BasePlayer Bundle](https://github.com/pumukit/PuMuKIT/tree/master/src/Pumukit/BasePlayerBundle). It adds a Paella Player to the WebTV Portal to be used instead of the default [JW Player Bundle](https://github.com/pumukit/PuMuKIT/tree/master/src/Pumukit/JWPlayerBundle)

## Installation

Step 1 requires you to have Composer installed globally, as explained in the [installation chapter](https://getcomposer.org/doc/00-intro.md) of the Composer documentation.


### Step 1: Download the Bundle

Open a command console, enter your project directory and execute the
following command to download the latest stable version of this bundle:

```bash
$ composer require teltek/pumukit-paella-player-bundle 4.0.x-dev
```

### Step 2: Configuring PaellaPlayer instead of JWPlayer

The JWPlayerBundle needs to be uninstalled in order for the Paella Player to work properly:

Remove the next line from config/bundles.php
```
Pumukit\JWPlayerBundle\PumukitJWPlayerBundle::class => ['all' => true],
```

Remove the next lines from config/routes/annotations.yaml
```
pumukit_jw_player:
  resource: "@PumukitJWPlayerBundle/Resources/config/routing.yml"
  prefix:   /
```

Remove file config/packages/pumukit_jwplayer.yaml

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

### Step 3: Update assets

```bash
$ php app/console cache:clear
$ php app/console cache:clear --env=prod
$ php app/console assets:install
```
