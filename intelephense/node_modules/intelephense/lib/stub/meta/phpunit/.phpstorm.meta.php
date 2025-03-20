<?php
/**
 * PHPUnit provides it's own .phpstorm.meta.php starting from PHPUnit 9,
 * this bridge is identical to it and exists to support PHPUnit <= 8
 */

//modified by Mewburn Projects Pty Ltd

namespace PHPSTORM_META {

    override(
        \PHPUnit\Framework\TestCase::createMock(0),
        map([
            '@&\PHPUnit\Framework\MockObject\MockObject',
        ])
    );

    override(
        \PHPUnit\Framework\TestCase::createStub(0),
        map([
            '@&\PHPUnit\Framework\MockObject\Stub',
        ])
    );

    override(
        \PHPUnit\Framework\TestCase::createConfiguredMock(0),
        map([
            '@&\PHPUnit\Framework\MockObject\MockObject',
        ])
    );

    override(
        \PHPUnit\Framework\TestCase::createPartialMock(0),
        map([
            '@&\PHPUnit\Framework\MockObject\MockObject',
        ])
    );

    override(
        \PHPUnit\Framework\TestCase::createTestProxy(0),
        map([
            '@&\PHPUnit\Framework\MockObject\MockObject',
        ])
    );

    override(
        \PHPUnit\Framework\TestCase::getMockForAbstractClass(0),
        map([
            '@&\PHPUnit\Framework\MockObject\MockObject',
        ])
    );
}
