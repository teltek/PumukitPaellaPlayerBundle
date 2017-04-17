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

    private function makePaellaData($mmobj, $tracks = [])
    {
        $paellaData = [
            'streams' => [],
            'metadata' => [
                'title' => $mmobj->getTitle(),
                'description' => $mmobj->getDescription(),
                'duration' => 0, // $mmobj->getDuration() (The service ALWAYS returns 0)
            ],
        ];
        foreach ($tracks as $id => $track) {
            $paellaData['streams'][$id] = [
                'sources' => [
                    'mp4' => [
                        0 => [
                            'src' => $this->trackUrlService->generateTrackFileUrl($track, true),
                        ],
                    ],
                ],
            ];
            if ($track->containsAnyTag(['display', 'presenter/delivery'])) {
                $paellaData['streams'][$id]['preview'] = $this->picService->getFirstUrlPic($mmobj, true, false);
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
        $trackPresenter->setTags(array('display'));

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
        $trackPresentation->setTags(array('presentation/delivery'));
        $trackPresentation->setVcodec('h264');

        $trackSBS = new Track();
        $trackSBS->setDuration(2);
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
        $trackPresenter2->setTags(array('presenter/delivery'));
        $mmobj->addTrack($trackPresenter2);

        $trackPresenter3 = new Track();
        $trackPresenter3->setVcodec('vp8');
        $trackPresenter3->setDuration(2);
        $trackPresenter3->setTags(array('presenter/delivery'));
        $mmobj->addTrack($trackPresenter3);

        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presentation & presenterDup
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter2, $trackPresentation]), $responseData);

        //Should return presenterDup
        $response = $this->callRepo($mmobj, $trackPresenter3);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter3]), $responseData);

        //Should return presenter
        $response = $this->callRepo($mmobj, $trackPresenter);
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals($this->makePaellaData($mmobj, [$trackPresenter]), $responseData);
    }
}
