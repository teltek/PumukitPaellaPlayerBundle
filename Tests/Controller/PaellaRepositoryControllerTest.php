<?php

namespace Pumukit\PaellaPlayerBundle\Tests\Controller;

use Pumukit\CoreBundle\Tests\PumukitTestCase;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Pumukit\SchemaBundle\Document\Track;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * @internal
 * @coversNothing
 */
class PaellaRepositoryControllerTest extends PumukitTestCase
{
    private $factoryService;
    private $picService;
    private $trackUrlService;

    public function setUp(): void
    {
        parent::setUp();

        $options = ['environment' => 'test'];
        static::bootKernel($options);

        $this->factoryService = static::$kernel->getContainer()->get('pumukitschema.factory');
        $this->picService = static::$kernel->getContainer()->get('pumukitschema.pic');
        $this->trackUrlService = static::$kernel->getContainer()->get('pumukit_baseplayer.trackurl');
    }

    public function tearDown(): void
    {
        parent::tearDown();
        $this->factoryService = null;
        $this->picService = null;
        $this->trackUrlService = null;
        gc_collect_cycles();
    }

    public function testPaellaRepository(): void
    {
        $series = $this->factoryService->createSeries();
        $mmobj = $this->factoryService->createMultimediaObject($series);
        static::assertCount(0, $mmobj->getTracks());

        $trackPresenter = new Track();
        $trackPresenter->setDuration(2);
        $trackPresenter->setMimeType('video/mp4');
        $trackPresenter->setTags(['display', 'presenter/delivery']);
        $trackPresenter->setUrl('videotest.mp4');
        $this->dm->persist($trackPresenter);
        $mmobj->addTrack($trackPresenter);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        $response = $this->callRepo($mmobj);
        static::assertEquals(200, $response->getStatusCode());

        $mmobj->setStatus(MultimediaObject::STATUS_PUBLISHED);
        $this->dm->flush();

        //Should return ok and empty
        $response = $this->callRepo($mmobj);
        static::assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj), $responseData);

        $trackPresenter->setVcodec('h264');
        $this->dm->flush();

        //Should return presenter
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);

        static::assertEquals($this->makePaellaData($mmobj, [$trackPresenter]), $responseData);

        $trackPresentation = new Track();
        $trackPresentation->setDuration(2);
        $trackPresentation->setMimeType('video/mp4');
        $trackPresentation->setTags(['presentation/delivery']);
        $trackPresentation->setVcodec('h264');
        $trackPresentation->setUrl('videotest.mp4');

        $trackSBS = new Track();
        $trackSBS->setDuration(2);
        $trackSBS->setMimeType('video/mp4');
        $trackSBS->setTags(['sbs']);
        $trackSBS->setUrl('videotest.mp4');

        $mmobj->addTrack($trackPresentation);
        $mmobj->addTrack($trackSBS);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presenter
        $response = $this->callRepo($mmobj, $trackPresenter);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [$trackPresenter]), $responseData);

        //Should return presentation & presenter
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [$trackPresenter, $trackPresentation]), $responseData);

        //Should return empty
        $response = $this->callRepo($mmobj, $trackSBS);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj), $responseData);

        $trackSBS->addTag('display');
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return empty
        $response = $this->callRepo($mmobj, $trackSBS);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj), $responseData);

        $trackSBS->setVcodec('h264');
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return sbs
        $response = $this->callRepo($mmobj, $trackSBS);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [$trackSBS]), $responseData);

        //Should return presentation & presenter
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [$trackPresenter, $trackPresentation]), $responseData);

        $trackPresenter2 = new Track();
        $trackPresenter2->setVcodec('vp8');
        $trackPresenter2->setDuration(2);
        $trackPresenter2->setMimeType('video/webm');
        $trackPresenter2->setTags(['presenter/delivery']);
        $trackPresenter2->setUrl('videotest.mp4');
        $mmobj->addTrack($trackPresenter2);

        $trackPresenter3 = new Track();
        $trackPresenter3->setVcodec('vp8');
        $trackPresenter3->setDuration(2);
        $trackPresenter3->setMimeType('video/webm');
        $trackPresenter3->setTags(['presenter/delivery']);
        $trackPresenter3->setUrl('videotest.mp4');
        $mmobj->addTrack($trackPresenter3);

        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presentation & presenter (not Dup)
        $response = $this->callRepo($mmobj);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [[$trackPresenter, $trackPresenter2, $trackPresenter3], $trackPresentation]), $responseData);

        //Should return presenterDup
        $response = $this->callRepo($mmobj, $trackPresenter3);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [$trackPresenter3]), $responseData);

        //Should return presenter
        $response = $this->callRepo($mmobj, $trackPresenter);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [$trackPresenter]), $responseData);

        $trackAudio = new Track();
        $trackAudio->setDuration(2);
        $trackAudio->setMimeType('audio/mp3');
        $trackAudio->setTags(['audio', 'display']);
        $trackAudio->setUrl('audiotest.mp4');
        $trackAudio->setOnlyAudio(true);

        $mmobj->addTrack($trackAudio);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return presenter
        $response = $this->callRepo($mmobj, $trackAudio);
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals($this->makePaellaData($mmobj, [$trackAudio]), $responseData);
    }

    public function testAudioPaellaRepository(): void
    {
        //Init Mmobj
        $series = $this->factoryService->createSeries();
        $mmobj = $this->factoryService->createMultimediaObject($series);
        $mmobj->setStatus(MultimediaObject::STATUS_PUBLISHED);

        $track = new Track();
        $track->setDuration(2);
        $track->setOnlyAudio(true);
        $track->setMimeType('audio/mp3');
        $track->setTags(['display']);
        $track->setUrl('audiotest.mp3');
        $mmobj->addTrack($track);
        $mmobj->setType(MultimediaObject::TYPE_AUDIO);

        $this->dm->persist($series);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return ok and empty
        $response = $this->callRepo($mmobj);
        static::assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals(count($responseData['streams']), 1);
        static::assertEquals(count($responseData['streams'][0]['sources']), 1);

        static::assertEquals(
            $this->trackUrlService->generateTrackFileUrl($track, UrlGeneratorInterface::ABSOLUTE_URL),
            $responseData['streams'][0]['sources']['mp3'][0]['src']
        );
    }

    public function testMultipleAudioPaellaRepository(): void
    {
        //Init Mmobj
        $series = $this->factoryService->createSeries();
        $mmobj = $this->factoryService->createMultimediaObject($series);
        $mmobj->setStatus(MultimediaObject::STATUS_PUBLISHED);

        $track = new Track();
        $track->setDuration(2);
        $track->setOnlyAudio(true);
        $track->setTags(['display']);
        $track->setUrl('audiotest.mp3');
        $mmobj->addTrack($track);
        $mmobj->setType(MultimediaObject::TYPE_AUDIO);

        $track2 = new Track();
        $track2->setDuration(2);
        $track2->setOnlyAudio(true);
        $track2->setTags(['display']);
        $track2->setUrl('audiotest.mp3');
        $mmobj->addTrack($track2);

        $this->dm->persist($series);
        $this->dm->persist($mmobj);
        $this->dm->flush();

        //Should return ok and empty
        $response = $this->callRepo($mmobj, $track);
        static::assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals(count($responseData['streams']), 1);
        static::assertEquals(count($responseData['streams'][0]['sources']), 1);
        static::assertEquals(
            $this->trackUrlService->generateTrackFileUrl($track, UrlGeneratorInterface::ABSOLUTE_URL),
            $responseData['streams'][0]['sources']['mp4'][0]['src']
        );

        $response = $this->callRepo($mmobj, $track2);
        static::assertEquals(200, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        static::assertEquals(count($responseData['streams']), 1);
        static::assertEquals(count($responseData['streams'][0]['sources']), 1);
        static::assertEquals(
            $this->trackUrlService->generateTrackFileUrl($track2, UrlGeneratorInterface::ABSOLUTE_URL),
            $responseData['streams'][0]['sources']['mp4'][0]['src']
        );
    }

    private function callRepo(MultimediaObject $mmobj, ?Track $track = null): Response
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $url = sprintf('paellarepository/%s', $mmobj->getId());

        if ($track) {
            $url .= '?track_id='.$track->getId();
        }
        $client->request('GET', $url);

        return $client->getResponse();
    }

    private function makePaellaData(MultimediaObject $mmobj, array $trackLists = []): array
    {
        $paellaData = [
            'streams' => [],
            'metadata' => [
                'preview' => $this->picService->getFirstUrlPic($mmobj, true, false),
            ],
        ];
        foreach ($trackLists as $id => $tracks) {
            if (!is_array($tracks)) {
                $tracks = [$tracks];
            }

            $sources = [];
            $preview = false;
            foreach ($tracks as $track) {
                $mimeType = $track->getMimetype();
                $src = $this->trackUrlService->generateTrackFileUrl($track, UrlGeneratorInterface::ABSOLUTE_URL);
                //$src = $this->getAbsoluteUrl($request, $this->trackService->generateTrackFileUrl($track));

                $dataStreamTrack = [
                    'src' => $src,
                    'mimetype' => $mimeType,
                ];

                // If pumukit doesn't know the resolution, paella can guess it.
                if ($track->getWidth() && $track->getHeight()) {
                    $dataStreamTrack['res'] = ['w' => $track->getWidth(), 'h' => $track->getHeight()];
                }

                $type = explode('/', $mimeType)[1];
                if (!isset($sources[$type])) {
                    $sources[$type] = [];
                }
                $sources[$type][] = $dataStreamTrack;

                if (!$preview && $track->containsAnyTag(['display', 'presenter/delivery'])) {
                    $preview = $this->picService->getFirstUrlPic($mmobj, true, false);
                }

                $content = '';
                if ($track->containsAnyTag(['display', 'presenter/delivery'])) {
                    $content = 'presenter';
                } elseif ($track->containsAnyTag(['presentation/delivery'])) {
                    $content = 'presentation';
                }
            }
            $paellaData['streams'][$id] = ['sources' => $sources, 'language' => $tracks[0]->getLanguage(), 'content' => $content];

            if ($preview) {
                $paellaData['streams'][$id]['preview'] = $preview;
            }
        }

        return $paellaData;
    }
}
