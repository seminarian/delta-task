import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity()
@Index(['timestamp', 'assetId', 'userId'])
export class SearchEvent {
  @PrimaryColumn({ type: 'timestamptz' })
  timestamp: Date;

  @Column('int')
  userId: number;

  @Column('int')
  assetId: number;
}
