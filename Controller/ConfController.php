<?php

namespace Pumukit\PaellaPlayerBundle\Controller;

use Doctrine\ODM\MongoDB\DocumentManager;
use MongoDB\BSON\ObjectId;
use Pumukit\SchemaBundle\Document\MultimediaObject;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

class ConfController extends AbstractController
{
    public const PAELLA_ADVANCE_CONFIG_FOLDER = 'config/profiles/advanced';
    public const PAELLA_PR_CONFIG_FOLDER = 'config/profiles/pr';
    public const PAELLA_DEFAULT_CONFIG_FOLDER = 'config/profiles';

    private $documentManager;
    private $paellaXAPIEndpoint;
    private $paellaXAPIAuth;
    private $paellaAccessControlClass;
    private $paellaFootPrints;

    public function __construct(
        DocumentManager $documentManager,
        $paellaXAPIEndpoint,
        $paellaXAPIAuth,
        $paellaAccessControlClass,
        $paellaFootPrints
    ) {
        $this->documentManager = $documentManager;
        $this->paellaXAPIEndpoint = $paellaXAPIEndpoint;
        $this->paellaXAPIAuth = $paellaXAPIAuth;
        $this->paellaAccessControlClass = $paellaAccessControlClass;
        $this->paellaFootPrints = $paellaFootPrints;
    }

    /**
     * @Route("/paella/config.json", name="paella_player_config")
     */
    public function confAction(Request $request)
    {
        $id = $request->get('id');
        if (!$id || !preg_match('/^[0-9a-z]{24}$/', $id)) {
            throw new NotFoundHttpException('Multimedia Object not found with id '.$id);
        }

        $folders_profiles = $this->getPaellaProfileFolder($request);

        $jsonData = $this->renderView(
            '@PumukitPaellaPlayer/Conf/conf.json.twig',
            [
                'xapi_endpoint' => $this->paellaXAPIEndpoint,
                'xapi_auth' => $this->paellaXAPIAuth,
                'access_control_class' => $this->paellaAccessControlClass,
                'footprints' => $this->paellaFootPrints,
                'folders_profiles' => $folders_profiles,
            ]
        );

        return new Response($jsonData, 200, ['Content-Type' => 'application/json']);
    }

    private function getPaellaProfileFolder(Request $request): string
    {
        $multimediaObject = $this->documentManager->getRepository(MultimediaObject::class)->findOneBy(
            ['_id' => new ObjectId($request->get('id'))]
        );

        if (strpos($request->headers->get('referer'), 'advanced')) {
            return self::PAELLA_ADVANCE_CONFIG_FOLDER;
        }

        if ($multimediaObject->getProperty('personalrecorder')) {
            return self::PAELLA_PR_CONFIG_FOLDER;
        }

        return self::PAELLA_DEFAULT_CONFIG_FOLDER;
    }
}
