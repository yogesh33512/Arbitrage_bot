import { Schema, model, Document } from 'mongoose';

export interface IConfig extends Document {
    capital: number;
    profitThreshold: number;
    slippageTolerance: number;
}

const ConfigSchema = new Schema<IConfig>({
    capital: { type: Number, required: true },
    profitThreshold: { type: Number, default: 2 },
    slippageTolerance: { type: Number, default: 0.5 }
});

export const Config = model<IConfig>('Config', ConfigSchema);
