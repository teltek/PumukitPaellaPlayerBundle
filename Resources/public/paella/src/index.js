import {Paella,defaultLoadVideoManifestFunction, utils, Events} from 'paella-core';
import getBasicPluginContext from 'paella-basic-plugins';
import getSlidePluginContext from 'paella-slide-plugins';
import getZoomPluginContext from 'paella-zoom-plugin';
import getUserTrackingPluginContext from 'paella-user-tracking';
import getTeltekPluginsContext from "paella-teltek-plugins";

import fullscreenIcon from './icons/fullscreen.svg';
import windowedIcon from './icons/fullscreen.svg';
import captionsIcon from './icons/captions.svg';
import playIcon from './icons/play.svg';
import pauseIcon from './icons/pause.svg';
import volumeHighIcon from './icons/volume-high.svg';
import volumeLowIcon from './icons/volume-low.svg';
import volumeMidIcon from './icons/volume-mid.svg';
import volumeMuteIcon from './icons/volume-mute.svg';

import packageData from "../package.json";

window.onload = async () => {

    const baseURL = window.location.href;
    const params = new URLSearchParams(window.location.search);

    if(baseURL.search('playlist') !== -1) {
        var configID = params.get('videoId');
    } else {
        var configID = location.pathname.split('/').slice(-1)[0];
    }

    let hasIntro = false;
    let hasTail = false;
    let introLoaded = false;
    let tailLoaded = false;
    let originalVideoLoaded = false;

    const initParams = {
        loadVideoManifest: async (videoManifestUrl, config, player) => {
            const result = await defaultLoadVideoManifestFunction(videoManifestUrl, config, player);

            hasIntro = (typeof result.intro !== 'undefined');
            hasTail = (typeof result.tail !== 'undefined');

            if (hasIntro && !introLoaded) {
                videoManifestUrl = result.intro;
                return await defaultLoadVideoManifestFunction(videoManifestUrl, config, player);
            }

            if(originalVideoLoaded && hasTail && !tailLoaded) {
                videoManifestUrl = result.tail;
                tailLoaded = true;
                return await defaultLoadVideoManifestFunction(videoManifestUrl, config, player);
            }

            return result;
        },
        customPluginContext: [
            getBasicPluginContext(),
            getSlidePluginContext(),
            getZoomPluginContext(),
            getUserTrackingPluginContext(),
            getTeltekPluginsContext()
        ],
        configResourcesUrl: '/paella/',
        configUrl: '/paella/config.json' + '?configID='+ configID,
        repositoryUrl: '/paellarepository/',
        getVideoId: (config, player) => {
            return location.pathname.split('/').slice(-1)[0];
        },
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

            if(location.search("secret") !== -1) {
                return '/secret' + `${repoUrl}${videoId}`;
            }

            return `${repoUrl}${videoId}`;
        },
        getManifestFileUrl: (manifestUrl) => {
            return manifestUrl;
        },
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
        await paella.loadManifest().then(() => {
            paella.addCustomPluginIcon("es.upv.paella.playPauseButton","play",playIcon);
            paella.addCustomPluginIcon("es.upv.paella.playPauseButton","pause",pauseIcon);
            paella.addCustomPluginIcon("es.upv.paella.fullscreenButton","fullscreenIcon",fullscreenIcon);
            paella.addCustomPluginIcon("es.upv.paella.fullscreenButton","windowedIcon",windowedIcon);
            paella.addCustomPluginIcon("es.upv.paella.captionsSelectorPlugin","captionsIcon",captionsIcon);
            paella.addCustomPluginIcon("es.upv.paella.volumeButtonPlugin","volumeHighIcon",volumeHighIcon);
            paella.addCustomPluginIcon("es.upv.paella.volumeButtonPlugin","volumeLowIcon",volumeLowIcon);
            paella.addCustomPluginIcon("es.upv.paella.volumeButtonPlugin","volumeMidIcon",volumeMidIcon);
            paella.addCustomPluginIcon("es.upv.paella.volumeButtonPlugin","volumeMuteIcon",volumeMuteIcon);
        });
        await utils.loadStyle('src/style.css');
    } catch (e) {
        console.error(e);
    }

    paella.bindEvent(Events.ENDED, async () => {
        if (hasIntro && !introLoaded) {
            introLoaded = true;
            await paella.reload();
        }

        if(originalVideoLoaded && hasTail && !tailLoaded) {
            await paella.reload();
        }

        originalVideoLoaded = true;

    }, false);

    paella.bindEvent(Events.PLAYER_LOADED, async () => {
        // Check time param in URL and seek: ?time=00:01:30
        const timeString = utils.getHashParameter('time') || utils.getUrlParameter('time');
        if (timeString) {
            const totalTime = utils.timeToSeconds(timeString);
            await paella.videoContainer.setCurrentTime(totalTime);
        }
    });
}
