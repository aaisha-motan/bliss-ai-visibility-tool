-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "chatgptTokenValid" BOOLEAN,
ADD COLUMN     "lastTokenValidation" TIMESTAMP(3),
ADD COLUMN     "perplexityTokenValid" BOOLEAN;
