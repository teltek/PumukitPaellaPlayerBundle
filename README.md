# Paella Player Bundle

Bundle based on [Symfony](http://symfony.com/) to work with the [PuMuKIT2 Video Platform](https://github.com/campusdomar/PuMuKIT2/blob/2.1.x/README.md).

This bundle overrides the [PuMuKIT-2 BasePlayer Bundle](https://github.com/campusdomar/PuMuKIT2/tree/master/src/Pumukit/BasePlayerBundle). It adds a Paella Player to the WebTV Portal to be used instead of the default [JW Player Bundle](https://github.com/campusdomar/PuMuKIT2/tree/master/src/Pumukit/JWPlayerBundle)

## Installation

Step 1 requires you to have Composer installed globally, as explained
in the [installation chapter](https://getcomposer.org/doc/00-intro.md)
of the Composer documentation.


### Step 1: Download the Bundle

Open a command console, enter your project directory and execute the
following command to download the latest stable version of this bundle:

```bash
$ composer require teltek/pmk2-paella-player-bundle 1.3.x-dev
```

### Step 2: Uninstall the default JW Player Bundle

The JWPlayerBundle needs to be uninstalled in order for the Paella Player to work propertly:

Uninstall the bundle by executing the following line command. This command updates the Kernel to remove the bundle (app/AppKernel.php) and unloads the boundle routes from (app/config/routing.yml).

```bash
$ php app/console pumukit:install:bundle --uninstall Pumukit/JWPlayerBundle/PumukitJWPlayerBundle
```

### Step 3: Install the Bundle

After uninstalling the default JWPlayer, install the bundle by executing the same command as before, without the --uninstall option and with the PaellaPlayerBundle namespace this time.
.

```bash
$ php app/console pumukit:install:bundle Pumukit/PaellaPlayerBundle/PumukitPaellaPlayerBundle
```

### Step 4: Update assets

```bash
$ php app/console cache:clear
$ php app/console cache:clear --env=prod
$ php app/console assets:install
```
