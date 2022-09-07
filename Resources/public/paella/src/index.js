import { Paella, utils } from 'paella-core';
import getBasicPluginContext from 'paella-basic-plugins';
import getSlidePluginContext from 'paella-slide-plugins';
import getZoomPluginContext from 'paella-zoom-plugin';
import getUserTrackingPluginContext from 'paella-user-tracking';
import getTeltekPluginsContext from "paella-teltek-plugins";

import packageData from "../package.json";

window.onload = async () => {
    const initParams = {
        customPluginContext: [
            getBasicPluginContext(),
            getSlidePluginContext(),
            getZoomPluginContext(),
            getUserTrackingPluginContext(),
            getTeltekPluginsContext()
        ],

        // Aquí puedes personalizar las URLs de carga del fichero de configuración, en el caso de que no lo obtengas
        // de la ubicación por defecto
        configResourcesUrl: '/paella/',
        configUrl: '/paella/config.json',

        // Aquí puedes personalizar la URL de obtención de los datos del vídeo, en concreto, la parte estática de la URL
        repositoryUrl: '/paellarepository/',

        // Esta función sirve para que devuelvas el identificador único del vídeo con el cual puedes obtener sus datos
        // desde tu portal.
        getVideoId: (config, player) => {
            // En la implementación por defecto, se obtiene del parámetro `id` de la URL, en tu caso puedes personalizar
            // este parámetro para obtener el vídeo desde otro parámetro, desde una cookie o como consideres oportuno
            return location.pathname.split('/').slice(-1)[0];
        },
        // Esta parte es para formar la URL complete de la carga del video. Recibe como parámetro la URL anterior
        // (respositoryUrl), así que en la práctica podrías implementar aquí la URL completa y prescindir de
        // la función anterior. El parámetro `videoId` se obtiene de la función `getVideoId`
        getManifestUrl: (repoUrl,videoId) => {
            let location = window.location.href;
            const params = new URLSearchParams(window.location.search);

            if(location.search('playlist') !== -1 && location.search('secret') !== -1) {
                let playlistId = params.get('playlistId');
                let pos = params.get('videoPos');
                return '/secret/paellaplaylist/' + playlistId + '?videoPos=' + pos;
            }

            if(location.search('playlist') !== -1) {
                let playlistId = params.get('playlistId');
                let pos = params.get('videoPos');
                return '/paellaplaylist/' + playlistId + '?videoPos=' + pos;
            }

            if(location.search("secret") != -1) {
                return '/secret' + `${repoUrl}${videoId}`;
            }

            return `${repoUrl}${videoId}`;
        },

        // Esta función devuelve la URL complete del archivo manifest del vídeo. En la implementación por defecto de
        // paella player, aquí se añade el nombre de archivo /data.json, pero en Opencast no es necesario modificar
        // la url, así que la devolvemos tal cual
        getManifestFileUrl: (manifestUrl) => {
            return manifestUrl;
        },

        // Esta es la función donde se realiza la conversión del fichero manifest de opencast al formato de paella player.
        // Seguramente la mayor parte de la implementación la tendrás que hacer aquí. Ten en cuenta que es una función asíncrona,
        // así que tendrás que implementarla asíncrona o bien utilizar promesas. Por lo que me cuentas, el problema que tienes
        // seguramente estará aquí.

        loadVideoManifest: async function (url, config, player) {
            // Aquí es donde tendrías que hacer la llamada a tu portal para obtener los datos
            // del vídeo para formar el manifest en el formato de paella, tal cual indica en la
            // documentación:
            // https://github.com/polimediaupv/paella-core/blob/main/doc/video_manifest.md
            // Esto es un código de ejemplo, aquí tendrías que modificar lo que haga falta para adaptarlo a tu portal
            const response = await fetch(url);
            const pumukitVideoData = await response.json();

            return pumukitVideoData;

        }
    };

    class PaellaPlayer extends Paella {
        get version() {
            const player = packageData.version;
            const coreLibrary = super.version;
            const pluginModules = this.pluginModules.map(m => `${m.moduleName}: ${m.moduleVersion}`);
            return {
                player,
                coreLibrary,
                pluginModules
            };
        }
    }

    const paella = new PaellaPlayer('player-container', initParams);

    try {
        await paella.loadManifest();
        await utils.loadStyle('src/style.css');
    } catch (e) {
        console.error(e);
    }
}
