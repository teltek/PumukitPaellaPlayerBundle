<?php

namespace Pumukit\PaellaPlayerBundle\Tests\Controller;

use Pumukit\SchemaBundle\Document\Track;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class PaellaRepositoryControllerTest extends WebTestCase
{
    private $dm;
    private $factoryService;
    private $picService;
    private $trackUrlService;

    public function setUp()
    {
        $options = array('environment' => 'test');
        static::bootKernel($options);

        $this->dm = static::$kernel->getContainer()->get('doctrine_mongodb')->getManager();
        $this->factoryService = static::$kernel->getContainer()->get('pumukitschema.factory');
        $this->picService = static::$kernel->getContainer()->get('pumukitschema.pic');
        $this->trackUrlService = static::$kernel->getContainer()->get('pumukit_baseplayer.trackurl');
    }

    public function tearDown()
    {
        $this->dm = null;
        $this->factoryService = null;
        $this->picService = null;
        $this->trackUrlService = null;

        gc_collect_cycles();
        parent::tearDown();
    }

    private function callRepo($mmobj, $track = null)
    {
        $client = static::createClient();
        $url = sprintf('paellarepository/%s', $mmobj->getId());

        if ($track) {
            $url .= '?track_id='.$track->getId();
        }

        $client->request('GET', $url);
        $response = $client->getResponse();

        return $response;
    }

    private function makePaellaData($mmobj, $trackLists = [])
    {
        $paellaData = [
            'streams' => [],
            'metadata' => [
                'title' => $mmobj->getTitle(),
                'description' => $mmobj->getDescription(),
                'duration' => $mmobj->getDuration(),
                'i18nTitle' => $mmobj->getI18nTitle(),
                'i18nDescription' => $mmobj->getI18nDescription(),
            ],
        ];
        foreach ($trackLists as $id => $tracks) {
            if (!is_array($tracks)) {
                $tracks = [$tracks];
            }
            $sources = array();
            foreach ($tracks as $track) {
                $mimeType = $track->getMimetype();
                $src = $this->trackUrlService->generateTrackFileUrl($track, true);
                //$src = $this->getAbsoluteUrl($request, $this->trackService->generateTrackFileUrl($track, true));

                $dataStreamTrack = array(
                    'src' => $src,
                    'mimetype' => $mimeType,
                );

                // If pumukit doesn't know the resolution, paella can guess it.
                if ($track->getWidth() && $track->getHeight()) {
                    $dataStreamTrack['res'] = array('w' => $track->getWidth(), 'h' => $track->getHeight());
                }

                $type = explode('/', $mimeType)[1];
                if (!isset($sources[$type])) {
                    $sources[$type] = array();
                }
                $sources[$type][] = $dataStreamTrack;

                if ($track->containsAnyTag(['display', 'presenter/delivery']) && !isset($preview)) {
                    $preview = $this->picService->getFirstUrlPic($mmobj, true, false);
                }
            }
            $paellaData['streams'][$id] = array('sources' => $sources, 'language' => $tracks[0]->getLanguage());

            if ($preview) {
                $paellaData['streams'][$id]['preview'] = $preview;
                $preview = false;
            }
        }

        return $paellaData;
    }

    public function testPaellaRepository()
    {
        //Init Mmobj
        $series = $this->factoryService->createSeries();
        $mmobj = $this->factoryService->createMultimediaObject($series);

        $this->assertEquals(0, count($mmobj->getTracks()));

        $this->dm->persist($series);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        $trackPresenter = new Track();
        $trackPresenter->setDuration(2);
        $trackPresenter->setMimetype('video/mp4');
        $trackPresenter->setTags(array('display', 'presenter/delivery'));

        $mmobj->addTrack($trackPresenter);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return 404
        $response = $this->callRepo($mmobj);
        $this->assertEquals(404, $response->getStatusCode());

        $mmobj->setStatus(MultimediaObject::STATUS_PUBLISHED);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return ok and empty
        $response = $this->callRepo($mmobj);
        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj), $responseData);

        $trackPresenter->setVcodec('h264');
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presenter
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);

        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter]), $responseData);

        $trackPresentation = new Track();
        $trackPresentation->setDuration(2);
        $trackPresentation->setMimetype('video/mp4');
        $trackPresentation->setTags(array('presentation/delivery'));
        $trackPresentation->setVcodec('h264');

        $trackSBS = new Track();
        $trackSBS->setDuration(2);
        $trackSBS->setMimetype('video/mp4');
        $trackSBS->setTags(array('sbs'));

        $mmobj->addTrack($trackPresentation);
        $mmobj->addTrack($trackSBS);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presenter
        $response = $this->callRepo($mmobj, $trackPresenter);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter]), $responseData);

        //Should return presentation & presenter
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter, $trackPresentation]), $responseData);

        //Should return empty
        $response = $this->callRepo($mmobj, $trackSBS);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj), $responseData);

        $trackSBS->addTag('display');
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return empty
        $response = $this->callRepo($mmobj, $trackSBS);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj), $responseData);

        $trackSBS->setVcodec('h264');
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return sbs
        $response = $this->callRepo($mmobj, $trackSBS);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackSBS]), $responseData);

        //Should return presentation & presenter
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter, $trackPresentation]), $responseData);

        $trackPresenter2 = new Track();
        $trackPresenter2->setVcodec('vp8');
        $trackPresenter2->setDuration(2);
        $trackPresenter2->setMimetype('video/webm');
        $trackPresenter2->setTags(array('presenter/delivery'));
        $mmobj->addTrack($trackPresenter2);

        $trackPresenter3 = new Track();
        $trackPresenter3->setVcodec('vp8');
        $trackPresenter3->setDuration(2);
        $trackPresenter3->setMimetype('video/webm');
        $trackPresenter3->setTags(array('presenter/delivery'));
        $mmobj->addTrack($trackPresenter3);

        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presentation & presenter (not Dup)
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [[$trackPresenter, $trackPresenter2, $trackPresenter3], $trackPresentation]), $responseData);

        //Should return presenterDup
        $response = $this->callRepo($mmobj, $trackPresenter3);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter3]), $responseData);

        //Should return presenter
        $response = $this->callRepo($mmobj, $trackPresenter);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter]), $responseData);

        $trackAudio = new Track();
        $trackAudio->setDuration(2);
        $trackAudio->setMimetype('audio/mp3');
        $trackAudio->setTags(array('audio', 'display'));
        $trackAudio->setOnlyAudio(true);

        $mmobj->addTrack($trackAudio);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presenter
        $response = $this->callRepo($mmobj, $trackAudio);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackAudio]), $responseData);
    }

    public function testAudioPaellaRepository()
    {
        //Init Mmobj
        $series = $this->factoryService->createSeries();
        $mmobj = $this->factoryService->createMultimediaObject($series);
        $mmobj->setStatus(MultimediaObject::STATUS_PUBLISHED);

        $track = new Track();
        $track->setDuration(2);
        $track->setOnlyAudio(true);
        $track->setMimetype('audio/mp3');
        $track->setTags(array('display'));
        $mmobj->addTrack($track);
        $mmobj->setType(MultimediaObject::TYPE_AUDIO);

        $this->dm->persist($series);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return ok and empty
        $response = $this->callRepo($mmobj);
        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals(count($responseData['streams']), 1);
        $this->assertEquals(count($responseData['streams'][0]['sources']), 1);

        $this->assertEquals($this->trackUrlService->generateTrackFileUrl($track, true),
                            $responseData['streams'][0]['sources']['mp3'][0]['src']);
    }

    public function testMultipleAudioPaellaRepository()
    {
        //Init Mmobj
        $series = $this->factoryService->createSeries();
        $mmobj = $this->factoryService->createMultimediaObject($series);
        $mmobj->setStatus(MultimediaObject::STATUS_PUBLISHED);

        $track = new Track();
        $track->setDuration(2);
        $track->setOnlyAudio(true);
        $track->setTags(array('display'));
        $mmobj->addTrack($track);
        $mmobj->setType(MultimediaObject::TYPE_AUDIO);

        $track2 = new Track();
        $track2->setDuration(2);
        $track2->setOnlyAudio(true);
        $track2->setTags(array('display'));
        $mmobj->addTrack($track2);

        $this->dm->persist($series);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return ok and empty
        $response = $this->callRepo($mmobj, $track);
        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals(count($responseData['streams']), 1);
        $this->assertEquals(count($responseData['streams'][0]['sources']), 1);
        $this->assertEquals($this->trackUrlService->generateTrackFileUrl($track, true),
                            $responseData['streams'][0]['sources']['mp4'][0]['src']);

        $response = $this->callRepo($mmobj, $track2);
        $this->assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals(count($responseData['streams']), 1);
        $this->assertEquals(count($responseData['streams'][0]['sources']), 1);
        $this->assertEquals($this->trackUrlService->generateTrackFileUrl($track2, true),
                            $responseData['streams'][0]['sources']['mp4'][0]['src']);
    }
}
