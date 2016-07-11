<?php

namespace Pumukit\PaellaPlayerBundle\Services;

use Pumukit\SchemaBundle\Document\EmbeddedBroadcast;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Series;
use Pumukit\SchemaBundle\Document\Track;
use Pumukit\SchemaBundle\Services\PicService;
use Pumukit\SchemaBundle\Services\MaterialService;
use Pumukit\BasePlayerBundle\Services\TrackUrlService;
use Pumukit\BasePlayerBundle\Services\SeriesPlaylistService;
use Pumukit\WebTVBundle\Services\UserAgentParserService;
use SunCat\MobileDetectBundle\DeviceDetector\MobileDetector;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class PaellaDataService
{
    private $picService;
    private $trackService;
    private $opencastClient = null;
    private $mobileDetectorService;
    private $userAgentParserService;

    public function __construct(PicService $picService, TrackUrlService $trackService, SeriesPlaylistService $playlistService, MaterialService $materialService, UrlGeneratorInterface $urlGenerator, MobileDetector $mobileDetectorService, UserAgentParserService $userAgentParserService)
    {
        $this->picService = $picService;
        $this->trackService = $trackService;
        $this->playlistService = $playlistService;
        $this->materialService = $materialService;
        $this->urlGenerator = $urlGenerator;
        //Only used to check whether the request is mobile and return a side-by-side on opencast videos.
        $this->mobileDetectorService = $mobileDetectorService;
        $this->userAgentParserService = $userAgentParserService;
    }

    public function setOpencastClient($opencastClient)
    {
        $this->opencastClient = $opencastClient;
    }

    /**
     * Returns a dictionary array with the playlist data using the paella playlist plugin necessary structure.
     *
     * This structure can be later serialized and returned as a json file for the paella player to use.
     */
    public function getPaellaPlaylistData(Series $series, Request $request, $criteria = array())
    {
        $mmobjs = $this->playlistService->getPlaylistMmobjs($series, $criteria);

        $data = array();
        foreach($mmobjs as $pos => $mmobj) {
            $url = $this->urlGenerator->generate(
                'pumukit_playlistplayer_paellaindex',
                array(
                    'playlistId' => $series->getId(),
                    'videoId' => $mmobj->getId(),
                    'videoPos' => $pos,
                    'autostart' => 'true',
                ),
                true  //Makes the url absolute.
            );
            $data[] = array(
                'name' => $mmobj->getTitle(),
                'id' => $mmobj->getId(),
                'pos' => $pos,
                'url' => $url,
            );
        }

        return $data;
    }

    /**
     * Returns a dictionary array with the mmobj data using the paella prefered structure
     *
     * This structure can be later serialized and returned as a json file for the paella player to use.
     */
    public function getPaellaMmobjData(MultimediaObject $mmobj, Request $request)
    {
        $trackId = $request->query->get('track_id');
        $isMobile = $this->isMobile($request);

        $data = array();
        $data['streams'] = array();

        $tracks = $this->getMmobjTracks($mmobj, $trackId);
        if($isMobile) {
            if($tracks['sbs']) {
                $dataStream = $this->buildDataStream($tracks['sbs'], $request);
            }
            else if($tracks['display']) {
                $pic = $this->picService->getFirstUrlPic($mmobj, true, false);
                $dataStream = $this->buildDataStream($tracks['display'], $request);
            }
            $data['streams'][] = $dataStream;
        }
        else {
            if($tracks['display']) {
                $dataStream = $this->buildDataStream($tracks['display'], $request);
                $pic = $this->picService->getFirstUrlPic($mmobj, true, false);
                $dataStream['preview'] = $pic;
                $data['streams'][] = $dataStream;
            }
            if($tracks['presentation']) {
                $dataStream = $this->buildDataStream($tracks['presentation'], $request);
                $data['streams'][] = $dataStream;
            }
        }
        $data['metadata'] = array(
            'title' => $mmobj->getTitle(),
            'description' => $mmobj->getDescription(),
            'duration' => 0
        );

        $frameList = $this->getOpencastFrameList($mmobj);
        if($frameList)
            $data['frameList'] = $frameList;

        $captions = $this->getCaptions($mmobj, $request);
        if ($captions) {
            $data['captions'] = $captions;
        }

        return $data;
    }

    /**
     * Returns the absolute url from a given path or url
     */
    private function getAbsoluteUrl($request, $url) {
        if (false !== strpos($url, '://') || 0 === strpos($url, '//')) {
            return $url;
        }

        if ('' === $request->getHost()) {
            return $url;
        }
        return $request->getSchemeAndHttpHost().$request->getBasePath().$url;
    }

    /**
     * Returns an array (can be empty) of tracks for the mmobj
     */
    private function getMmobjTracks(MultimediaObject $mmobj, $trackId)
    {
        $tracks = array(
            'display' => false,
            'presentation' => false,
            'sbs' => false,
        );
        if($mmobj->getProperty('opencast')) {
            $presenterTracks = $mmobj->getFilteredTracksWithTags(array('presenter/delivery'));
            $presentationTracks = $mmobj->getFilteredTracksWithTags(array('presentation/delivery'));
            $sbsTrack =  $mmobj->getFilteredTrackWithTags(array('sbs'));
            foreach($presenterTracks as $track) {
                if($track->getVcodec() == 'h264') {
                    $tracks['display'] = $track;
                    break;
                }
            }
            foreach($presentationTracks as $track) {
                if($track->getVcodec() == 'h264') {
                    $tracks['presentation'] = $track;
                    break;
                }
            }
            if($sbsTrack && $sbsTrack->getVcodec() == 'h264')
                $tracks['sbs'] = $sbsTrack;
        }
        else {
            if($trackId) {
                $track = $mmobj->getTrackById($trackId);
                if(!$track->containsTag('display'))
                    $track = null;
            }
            else {
                $track = $mmobj->getFilteredTrackWithTags(array('display'));
            }
            if($track)
                $tracks['display'] = $track;
        }

        return $tracks;
    }

    /**
     * Returns a frameList formatted to be added to the paella
     */
    private function getOpencastFrameList($mmobj) {
        //If there is no opencast client this won't work
        if(!$this->opencastClient)
            return array();

        $images = array();
        //Only works if the video is an opencast video
        if($opencastId = $mmobj->getProperty('opencast')) {
            $mediaPackage = $this->opencastClient->getMediaPackage($opencastId);
            //If it doesn't have attachments as opencast should, we return an empty result
            if(!isset($mediaPackage['attachments']['attachment']))
                return array();

            foreach($mediaPackage['attachments']['attachment'] as $attachmnt) {
                if($attachmnt['type'] == 'presentation/segment+preview') {
                    $result = array();

                    //Getting time by parsing hours, minutes and second of a string of this type ->  time=T12:12:12:0F1000
                    preg_match('/time\=T(.*?):(.*?):(.*?):;*/',$attachmnt['ref'], $result);
                    $time = $result[1]*3600 + $result[2]*60 + $result[3];

                    $images[] = array('id' =>'frame_'.$time,
                                      'mimetype' => $attachmnt['mimetype'],
                                      'time' => $time,
                                      'url' => $attachmnt['url'],
                                      'thumb' => $attachmnt['url'],
                    );
                }
            }
        }
        return $images;
    }


    /**
     * Returns a caption list formatted to be added to the paella.
     */
    private function getCaptions(MultimediaObject $mmobj, Request $request)
    {
        $captions = $this->materialService->getCaptions($mmobj);

        $captionsMapped = array_map(
            function ($material) use ($request) {
                return array('lang' => $material->getLanguage(),
                             'text' => $material->getName() ? $material->getName() : $material->getLanguage(),
                             'format' => $material->getMimeType(),
                             'url' => $this->getAbsoluteUrl($request, $material->getUrl()), );
            },
            $captions->toArray()
        );
        return array_values($captionsMapped);
    }

    /**
     * Returns a data array with the required paella structure for a 'data stream'.
     */
    private function buildDataStream(Track $track, Request $request)
    {
        $src = $this->getAbsoluteUrl($request, $this->trackService->generateTrackFileUrl($track, true));
        $mimeType = $track->getMimetype();
        $dataStream = array(
            'sources' => array(
                'mp4' => array(
                    array(
                        'src' => $src,
                        'mimetype' => $mimeType
                    )
                )
            ),
        );

        // If pumukit doesn't know the resolution, paella can guess it.
        if ($track->getWidth() && $track->getHeight()) {
            $dataStream['sources']['mp4'][0]['res'] = array('w' => $track->getWidth(), 'h' => $track->getHeight());
        }

        return $dataStream;
    }

    /**
     * Returns whether the request comes from a 'mobile device'
     */
    private function isMobile(Request $request)
    {
        $userAgent = $request->headers->get('user-agent');
        $isMobileDevice = ($this->mobileDetectorService->isMobile($userAgent) || $this->mobileDetectorService->isTablet($userAgent));
        $isOldBrowser = $this->userAgentParserService->isOldBrowser($userAgent);
        return $isMobileDevice || $isOldBrowser;
    }

}
