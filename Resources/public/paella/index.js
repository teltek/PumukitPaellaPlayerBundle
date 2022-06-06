
import { Paella, utils } from 'paella-core';
import getBasicPluginContext from 'paella-basic-plugins';
import getSlidePluginContext from 'paella-slide-plugins';
import getZoomPluginContext from 'paella-zoom-plugin';
import getUserTrackingPluginContext from 'paella-user-tracking';

import packageData from "./package.json";

window.onload = async () => {
    
    class PaellaPlayer extends Paella {
        get version() {
            const player = packageData.version;
            const coreLibrary = super.version;
            const pluginModules = this.pluginModules.map(m => `${ m.moduleName }: ${ m.moduleVersion }`);
            return {
                player,
                coreLibrary,
                pluginModules
            };
        }
    }

    function createInitParams (videoId) {
        let initParams = {
            configUrl: '/paella/config.json?id=' + videoId,
            customPluginContext: [
                require.context("./plugins", true, /\.js/),
                getBasicPluginContext(),
                getSlidePluginContext(),
                getZoomPluginContext(),
                getUserTrackingPluginContext()
            ]
        };

        return initParams;
    }

    const loadPaellaPlayer = (videoId) => {
        const initParams = createInitParams(videoId);

        const paellaPlayer = new PaellaPlayer('player-container', initParams);
        // try {
        //     await paella.loadManifest('Video manifest loaded');
        //     paella.log.debug();
      
        // } catch (err) {
        //     paella.log.error(err);
        // }
    }
}    
