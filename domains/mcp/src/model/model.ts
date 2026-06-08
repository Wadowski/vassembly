import { Model } from '@vassembly/model';

export class McpModel extends Model {
  slug!: string;
  name!: string;
  description!: string;
  tags!: string[];
  iconPath!: string;
  documentationUrl?: string | null;
  repositoryUrl?: string | null;
}
