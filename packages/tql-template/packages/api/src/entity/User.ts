import { Entity, ObjectIdColumn, ObjectID, Column } from 'typeorm';

@Entity()
export class User {
  @ObjectIdColumn()
  id!: ObjectID;

  @Column()
  email!: string;
}
