-- CreateTable
CREATE TABLE `Order` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `orderNumber` VARCHAR(191) NOT NULL,
    `userId` BIGINT NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `postcode` VARCHAR(191) NOT NULL,
    `address1` VARCHAR(191) NOT NULL,
    `address2` VARCHAR(191) NULL,
    `deliveryMemo` VARCHAR(191) NULL,
    `totalAmount` DOUBLE NOT NULL,
    `discountAmount` DOUBLE NOT NULL DEFAULT 0,
    `deliveryFee` DOUBLE NOT NULL DEFAULT 0,
    `finalAmount` DOUBLE NOT NULL,
    `orderStatus` ENUM('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `paymentStatus` ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `deliveryStatus` ENUM('PREPARING', 'SHIPPED', 'DELIVERED', 'RETURNED') NOT NULL DEFAULT 'PREPARING',
    `paymentMethod` ENUM('CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'PHONE', 'KAKAO_PAY', 'NAVER_PAY', 'TOSS_PAY') NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `usedCouponId` BIGINT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    INDEX `Order_userId_idx`(`userId`),
    INDEX `Order_orderStatus_idx`(`orderStatus`),
    INDEX `Order_paymentStatus_idx`(`paymentStatus`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    INDEX `Order_orderNumber_idx`(`orderNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `orderId` BIGINT NOT NULL,
    `productId` BIGINT NOT NULL,
    `optionId` BIGINT NULL,
    `quantity` INTEGER NOT NULL,
    `unitPrice` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `selectedOptionValue` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NOT NULL,
    `optionName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Coupon_coupon_type_idx` ON `Coupon`(`coupon_type`);

-- CreateIndex
CREATE INDEX `Coupon_issued_by_idx` ON `Coupon`(`issued_by`);

-- CreateIndex
CREATE INDEX `Coupon_start_date_end_date_idx` ON `Coupon`(`start_date`, `end_date`);

-- CreateIndex
CREATE INDEX `Coupon_valid_from_valid_to_idx` ON `Coupon`(`valid_from`, `valid_to`);

-- CreateIndex
CREATE INDEX `Notice_type_idx` ON `Notice`(`type`);

-- CreateIndex
CREATE INDEX `Notice_is_pinned_created_at_idx` ON `Notice`(`is_pinned`, `created_at`);

-- CreateIndex
CREATE INDEX `Product_sellerId_idx` ON `Product`(`sellerId`);

-- CreateIndex
CREATE INDEX `Product_categoryCode_idx` ON `Product`(`categoryCode`);

-- CreateIndex
CREATE INDEX `Product_saleStatus_displayStatus_idx` ON `Product`(`saleStatus`, `displayStatus`);

-- CreateIndex
CREATE INDEX `Product_createdAt_idx` ON `Product`(`createdAt`);

-- CreateIndex
CREATE INDEX `Product_displayName_idx` ON `Product`(`displayName`);

-- CreateIndex
CREATE INDEX `Review_rating_idx` ON `Review`(`rating`);

-- CreateIndex
CREATE INDEX `Review_createdAt_idx` ON `Review`(`createdAt`);

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_usedCouponId_fkey` FOREIGN KEY (`usedCouponId`) REFERENCES `Coupon`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_optionId_fkey` FOREIGN KEY (`optionId`) REFERENCES `ProductOption`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Review` RENAME INDEX `Review_productId_fkey` TO `Review_productId_idx`;

-- RenameIndex
ALTER TABLE `Review` RENAME INDEX `Review_userId_fkey` TO `Review_userId_idx`;
