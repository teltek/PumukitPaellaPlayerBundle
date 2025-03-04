<?php

declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude('var')
;

$config =  new PhpCsFixer\Config();
return $config->setRules([
    '@Symfony' => true,
    '@PhpCsFixer' => true,
    'array_syntax' => ['syntax' => 'short'],
    'is_null' => true,
    'list_syntax' => ['syntax' => 'short'],
    'modernize_types_casting' => true,
    'ternary_to_null_coalescing' => true,
    'combine_nested_dirname' => true,
    'phpdoc_types_order' => [
        'null_adjustment' => 'always_last',
        'sort_algorithm' => 'none',
    ],
])
->setFinder($finder)
->setRiskyAllowed(true)
;
