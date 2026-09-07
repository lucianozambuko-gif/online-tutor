import { IsIn } from 'class-validator';

export class UpgradeSubscriptionDto {
  @IsIn(['PLUS', 'PRO'])
  plan: 'PLUS' | 'PRO';
}
