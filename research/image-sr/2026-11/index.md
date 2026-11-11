---
layout: page
title: 2026-11月份图像超分辨论文调研
permalink: /research/image-sr/2026-11/
description: 2026年11月完成的检索、论文精读与待核验候选。
nav: false
---

截至北京时间 2026 年 11 月 11 日，本月已核验 9 篇正式主会论文，HAT、ATD、VOSR 和 DreamSR 完成正文、原图及补充材料精读，其余 5 篇等待全文核验。本轮仍未完成近五年全覆盖。

## 已完成的精读

[HAT CVPR 2023 论文精读]({{ '/research/image-sr/2026-11/hat-cvpr-2023/' | relative_url }})

HAT 在经典 bicubic 设置下通过大窗口、混合通道注意力和重叠跨窗口注意力提高重建结果。同任务预训练带来进一步收益，但额外数据与训练预算必须和结构贡献分开。

[ATD CVPR 2024 论文精读]({{ '/research/image-sr/2026-11/atd-cvpr-2024/' | relative_url }})

ATD 用小型自适应 token 字典向所有位置传播训练集先验，再按字典相似度把远距离纹理 token 分组。顺序消融中 AC-MSA 增量最大，但随机分组已经取得大部分分组收益；ATD 的 417G FLOPs 也略高于 HAT 的 412G。

[VOSR CVPR 2026 论文精读]({{ '/research/image-sr/2026-11/vosr-cvpr-2026/' | relative_url }})

VOSR 用结构条件、视觉语义条件和输入锚定的部分条件引导训练原生视觉扩散 SR，再蒸馏为一步模型。它的优势是感知质量、忠实度和速度的折中，不是所有指标全面领先；训练成本比较也排除了复用编码器的历史成本。

[DreamSR CVPR 2026 论文精读]({{ '/research/image-sr/2026-11/dreamsr-cvpr-2026/' | relative_url }})

DreamSR 以局部与全局提示的双分支控制缓解分块扩散的语义漂移，并采用一步去退化加 16 步纹理生成。它给出 2K 计时和 4K 定性结果，但没有以大规模成对 4K 真值基准证明所有生成细节都真实。

## 候选与待精读清单

候选分成不能直接合并排名的两条路线。HAT、SRFormer、DAT、ATD 和 MambaIRv2 关注经典重建与高效上下文建模；SeeSR、TSD-SR、VOSR 和 DreamSR 关注真实世界生成式复原与推理成本。

| 候选                                                                                                                                                                                           | 正式来源  | 核查重点                               | 当前状态               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------- | ---------------------- |
| [HAT](https://openaccess.thecvf.com/content/CVPR2023/html/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.html)                                              | CVPR 2023 | 方法、预训练与配置解释缺口             | 正文与补充已精读       |
| [SRFormer](https://openaccess.thecvf.com/content/ICCV2023/html/Zhou_SRFormer_Permuted_Self-Attention_for_Single_Image_Super-Resolution_ICCV_2023_paper.html)                                   | ICCV 2023 | 窗口、通道与成本取舍                   | 待全文精读             |
| [DAT](https://openaccess.thecvf.com/content/ICCV2023/html/Chen_Dual_Aggregation_Transformer_for_Image_Super-Resolution_ICCV_2023_paper.html)                                                   | ICCV 2023 | 空间与通道聚合的等预算贡献             | 待全文精读             |
| [ATD](https://openaccess.thecvf.com/content/CVPR2024/html/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.html)                        | CVPR 2024 | 自适应字典、类别注意力与复杂度边界     | 正文、补充与原图已精读 |
| [SeeSR](https://openaccess.thecvf.com/content/CVPR2024/html/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.html)                                           | CVPR 2024 | 语义提示、幻觉与采样成本               | 待全文精读             |
| [TSD-SR](https://openaccess.thecvf.com/content/CVPR2025/html/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_CVPR_2025_paper.html)                          | CVPR 2025 | 一步蒸馏的质量与速度协议               | 待全文精读             |
| [MambaIRv2](https://openaccess.thecvf.com/content/CVPR2025/html/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.html)                                                          | CVPR 2025 | 非因果状态空间与长程交互               | 待全文精读             |
| [VOSR](https://openaccess.thecvf.com/content/CVPR2026/html/Wu_VOSR_A_Vision-Only_Generative_Model_for_Image_Super-Resolution_CVPR_2026_paper.html)                                             | CVPR 2026 | 双视觉条件、引导与一步蒸馏             | 正文、补充与原图已精读 |
| [DreamSR](https://openaccess.thecvf.com/content/CVPR2026/html/Dong_DreamSR_Towards_Ultra-High-Resolution_Image_Super-Resolution_via_a_Receptive-Field_Enhanced_Diffusion_CVPR_2026_paper.html) | CVPR 2026 | 双分支控制、感受野与超高分辨率证据边界 | 正文、补充与原图已精读 |

下一轮按 SeeSR、TSD-SR、MambaIRv2、SRFormer 和 DAT 继续，并补查 ECCV、TPAMI、IJCV、NeurIPS、ICML、ICLR 及 2022 年来源。VOSR 与 DreamSR 已按官方论文编号、标准化标题和版本关系去重，没有把 arXiv 长版本重复计数。

## 本月覆盖边界

当前已核验上表 9 篇 CVPR/ICCV 官方记录，完成其中 4 篇全文与补充精读。ECCV、TPAMI、IJCV、NeurIPS、ICML、ICLR 以及 2022 年来源仍待系统补查；没有据此推断这些来源缺少合格工作。

[查看调研范围与比较标准]({{ '/research/image-sr/' | relative_url }}) · [返回栏目首页]({{ '/research/image-sr/' | relative_url }})
